import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase-admin";
import { criarMovimentacao } from "./estoque-movimentacoes";
import { devolverCredito } from "./assinaturas";
import { marcarComandaFinalizada, reconciliarDia } from "./caixas-abertos-agg";
import { registrarClientePorAgendamento } from "./clientes-agg";
import type { Comanda } from "./comandas-types";
import { calcularTotalItens } from "./comandas-types";

export type { Comanda } from "./comandas-types";

const COL = "comandas";

/** Remove chaves undefined (Firestore rejeita) e recalcula total. */
function limpar(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

/**
 * Espelha o status da comanda de volta no AGENDAMENTO vinculado (sync reverso).
 *
 * A sincronia agendamento→comanda já existe (rota PATCH do agendamento chama
 * finalizar/cancelar). Faltava o outro lado: quando a comanda é finalizada/
 * cancelada/reaberta DIRETO no Caixa, o agendamento ficava defasado (ex.: comanda
 * finalizada mas agendamento ainda "confirmado"). Este helper fecha esse buraco.
 *
 * Custo: 1 escrita, 0 leitura — o agendamentoId já veio no doc da comanda e o
 * update é idempotente (reescrever o mesmo status é inofensivo), então não vale a
 * pena gastar 1 leitura só pra checar antes.
 * Não há loop: escrevemos o campo `status` direto no doc do agendamento, sem passar
 * pela rota PATCH (que é quem dispararia o sync agendamento→comanda de volta).
 * Só age se houver agendamentoId (comandas avulsas não têm).
 */
async function espelharStatusNoAgendamento(
  comanda: Comanda,
  novoStatusAg: "concluido" | "cancelado" | "confirmado"
): Promise<void> {
  const agId = comanda.agendamentoId;
  if (!agId) return; // comanda avulsa (sem agendamento) — nada a espelhar
  try {
    const db = getAdminDb();
    await db.collection("agendamentos").doc(agId).update({
      status: novoStatusAg,
      atualizadoEm: Date.now(),
    });
  } catch {
    // não bloqueia a operação da comanda se o espelhamento falhar
    // (ex.: agendamento já excluído — update lança e cai aqui, sem quebrar nada)
  }
}

export async function criarComanda(
  data: Omit<Comanda, "id" | "status" | "criadoEm" | "atualizadoEm"> & { status?: Comanda["status"] }
): Promise<string> {
  const now = Date.now();
  const db = getAdminDb();
  const total = data.total ?? calcularTotalItens(data.itens ?? []);
  const doc = limpar({
    ...data,
    total,
    status: data.status ?? "aberta",
    criadoEm: now,
    atualizadoEm: now,
  });
  const ref = await db.collection(COL).add(doc);
  return ref.id;
}

export async function listarComandasPorData(data: string): Promise<Comanda[]> {
  const db = getAdminDb();
  const snap = await db.collection(COL).where("data", "==", data).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comanda));
}

/**
 * Lista comandas por JANELA DE DATA (campo `data`, YYYY-MM-DD).
 *
 * COTA: `comandas` é a coleção que mais cresce (nasce 1 por agendamento), e a
 * tela de Caixa lia TODAS a cada abertura. Filtrando no servidor, o custo passa
 * a ser proporcional à janela exibida, não ao histórico inteiro.
 * `de`/`ate` inclusivos. Sem argumentos mantém o comportamento antigo.
 */
export async function listarComandas(
  opts: { de?: string; ate?: string; limite?: number } = {}
): Promise<Comanda[]> {
  const db = getAdminDb();
  let q: FirebaseFirestore.Query = db.collection(COL);
  if (opts.de) q = q.where("data", ">=", opts.de);
  if (opts.ate) q = q.where("data", "<=", opts.ate);
  // Range exige orderBy no mesmo campo do filtro.
  q = opts.de || opts.ate ? q.orderBy("data", "desc") : q.orderBy("criadoEm", "desc");
  if (opts.limite) q = q.limit(opts.limite);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comanda));
}

export async function getComanda(id: string): Promise<Comanda | null> {
  const db = getAdminDb();
  const doc = await db.collection(COL).doc(id).get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as Comanda) : null;
}

/**
 * Acha a comanda de origem "agendamento" vinculada a um agendamentoId.
 * Usado pra manter comanda em sincronia quando o agendamento muda de status
 * (cancelar/concluir/reagendar). Retorna null se não houver.
 */
export async function getComandaPorAgendamento(agendamentoId: string): Promise<Comanda | null> {
  const db = getAdminDb();
  const snap = await db.collection(COL).where("agendamentoId", "==", agendamentoId).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Comanda;
}

export async function atualizarComanda(
  id: string,
  patch: Partial<Omit<Comanda, "id" | "criadoEm">>
): Promise<void> {
  const db = getAdminDb();
  const dados = limpar({ ...patch, atualizadoEm: Date.now() });
  await db.collection(COL).doc(id).update(dados);
}

export async function excluirComanda(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COL).doc(id).delete();
}

/**
 * Finaliza a comanda (transição aberta → finalizada):
 * - só age se a comanda estiver "aberta" (guarda contra dupla baixa de estoque);
 * - grava status/finalizadoEm/formaPagamento;
 * - baixa o estoque de cada item de produto (quantidade real) e registra movimentação.
 * Retorna a comanda finalizada, ou null se não existir/não estava aberta.
 */
export async function finalizarComanda(
  id: string,
  opts: { formaPagamento?: string } = {}
): Promise<Comanda | null> {
  const db = getAdminDb();
  const comanda = await getComanda(id);
  if (!comanda || comanda.status !== "aberta") return comanda ? null : null;

  const now = Date.now();
  await db.collection(COL).doc(id).update(
    limpar({
      status: "finalizada",
      formaPagamento: opts.formaPagamento ?? comanda.formaPagamento,
      finalizadoEm: now,
      atualizadoEm: now,
    })
  );

  // Sync reverso: agendamento vinculado passa a "concluido".
  await espelharStatusNoAgendamento(comanda, "concluido");

  // Agregador de caixas abertos: este dia agora tem faturamento real.
  await marcarComandaFinalizada(comanda.data);

  // Contador de clientes distintos (landing). O telefone só existe no agendamento,
  // por isso vai pelo id — e fora do caminho crítico, sem await.
  if (comanda.agendamentoId) registrarClientePorAgendamento(comanda.agendamentoId).catch(() => {});

  // Baixa de estoque — só produtos com produtoId. Usa FieldValue.increment (atômico),
  // respeitando a quantidade de cada item (default 1).
  const itensProduto = comanda.itens.filter((i) => i.tipo === "produto" && i.produtoId);
  await Promise.all(
    itensProduto.map(async (item) => {
      const produtoId = item.produtoId!;
      const qtd = item.quantidade ?? 1;
      try {
        const prodDoc = await db.collection("produtos").doc(produtoId).get();
        const prodData = prodDoc.data() ?? {};
        await criarMovimentacao({
          produtoId,
          produtoNome: (prodData.titulo as string) ?? item.descricao,
          produtoImagem: prodData.imagem as string | undefined,
          tipo: "venda",
          quantidade: -qtd,
          obs: `Comanda — ${comanda.clienteNome}`,
        });
        await db.collection("produtos").doc(produtoId).update({
          estoque: FieldValue.increment(-qtd),
          updatedAt: now,
        });
      } catch {
        // não bloqueia a finalização se a baixa de um item falhar
      }
    })
  );

  return { ...comanda, status: "finalizada", formaPagamento: opts.formaPagamento ?? comanda.formaPagamento, finalizadoEm: now };
}

export async function cancelarComanda(id: string): Promise<Comanda | null> {
  const comanda = await getComanda(id);
  if (!comanda || comanda.status !== "aberta") return null;
  await atualizarComanda(id, { status: "cancelada" });

  // Sync reverso: agendamento vinculado passa a "cancelado".
  await espelharStatusNoAgendamento(comanda, "cancelado");
  // Agregador: cancelar pode ter tirado a última comanda finalizada do dia — reconcilia.
  await reconciliarDia(comanda.data);
  // Simetria com a rota do agendamento: se era coberto por assinatura, devolve o crédito.
  if (comanda.cobertoPorAssinatura && comanda.assinaturaId) {
    devolverCredito(comanda.assinaturaId).catch(() => {});
  }

  return { ...comanda, status: "cancelada" };
}

/**
 * Reabre uma comanda finalizada (finalizada → aberta):
 * - estorna o estoque baixado na finalização (devolve produtos + registra movimento);
 * - limpa finalizadoEm.
 * Só age se a comanda estava "finalizada".
 */
export async function reabrirComanda(id: string): Promise<Comanda | null> {
  const db = getAdminDb();
  const comanda = await getComanda(id);
  if (!comanda || comanda.status !== "finalizada") return null;

  const now = Date.now();
  await db.collection(COL).doc(id).update({
    status: "aberta",
    finalizadoEm: FieldValue.delete(),
    atualizadoEm: now,
  });

  // Sync reverso: reabrir tira do faturamento → agendamento volta a "confirmado".
  await espelharStatusNoAgendamento(comanda, "confirmado");

  // Agregador: reabrir pode ter tirado a última comanda finalizada do dia — reconcilia.
  await reconciliarDia(comanda.data);

  // Estorna o estoque baixado na finalização (devolve os produtos).
  const itensProduto = comanda.itens.filter((i) => i.tipo === "produto" && i.produtoId);
  await Promise.all(
    itensProduto.map(async (item) => {
      const produtoId = item.produtoId!;
      const qtd = item.quantidade ?? 1;
      try {
        const prodDoc = await db.collection("produtos").doc(produtoId).get();
        const prodData = prodDoc.data() ?? {};
        await criarMovimentacao({
          produtoId,
          produtoNome: (prodData.titulo as string) ?? item.descricao,
          produtoImagem: prodData.imagem as string | undefined,
          tipo: "devolucao",
          quantidade: qtd,
          obs: `Reabertura de comanda — ${comanda.clienteNome}`,
        });
        await db.collection("produtos").doc(produtoId).update({
          estoque: FieldValue.increment(qtd),
          updatedAt: now,
        });
      } catch {
        // não bloqueia a reabertura se o estorno de um item falhar
      }
    })
  );

  return { ...comanda, status: "aberta" };
}
