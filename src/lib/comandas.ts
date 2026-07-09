import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase-admin";
import { criarMovimentacao } from "./estoque-movimentacoes";
import type { Comanda } from "./comandas-types";
import { calcularTotalItens } from "./comandas-types";

export type { Comanda } from "./comandas-types";

const COL = "comandas";

/** Remove chaves undefined (Firestore rejeita) e recalcula total. */
function limpar(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
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

export async function listarComandas(): Promise<Comanda[]> {
  const db = getAdminDb();
  const snap = await db.collection(COL).orderBy("criadoEm", "desc").get();
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
