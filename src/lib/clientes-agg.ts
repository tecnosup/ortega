import "server-only";
import { createHash } from "node:crypto";
import { getAdminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * CONTADOR de "clientes atendidos" — o número que aparece na landing (seção Sobre).
 *
 * O projeto não tem coleção `clientes`: cliente é um telefone que aparece em
 * `agendamentos`. Contar "de verdade" na hora da visita significaria varrer a
 * coleção inteira e deduplicar telefone — leitura proporcional ao histórico, na
 * página MAIS acessada do site. Exatamente o padrão que estourou a cota em 22/07.
 *
 * Então seguimos o mesmo caminho do agregador de caixas (`caixas-abertos-agg`):
 * o número é mantido ON-WRITE e a landing só LÊ 1 documento.
 *
 *   meta/clientesAtendidos   → { total: number, atualizadoEm: number }
 *   clientes_index/{hash}    → { primeiroEm: number }   (um doc por telefone único)
 *
 * O índice por telefone é o que torna a contagem DISTINTA sem varrer nada: se o doc
 * já existe, o cliente é recorrente e o total não sobe. Custo por atendimento
 * concluído: 1 leitura + (só na primeira vez) 2 escritas. São dezenas de eventos por
 * dia — irrelevante perto de varrer a coleção a cada visita da landing.
 */

const META_COL = "meta";
const META_DOC = "clientesAtendidos";
const IDX_COL = "clientes_index";

interface ContadorDoc {
  total?: number;
  atualizadoEm?: number;
}

/**
 * Canoniza o telefone: só dígitos, sem o 55 do país. "(12) 98258-5538",
 * "12982585538" e "5512982585538" têm que virar a MESMA chave — senão o mesmo
 * cliente conta duas vezes.
 */
export function normalizarTelefone(telefone: string): string {
  let d = (telefone || "").replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d;
}

/**
 * ID do documento de índice = HASH do telefone, nunca o telefone em claro.
 *
 * O id de um documento é a parte mais exposta do Firestore: aparece em regras,
 * em listagens e em qualquer query que escape. Como este índice só serve pra
 * responder "esse telefone já foi contado?", o hash resolve igual e a coleção
 * deixa de ser uma lista de telefones dos clientes do Igor — que é dado pessoal
 * (LGPD) e o ativo mais óbvio pra alguém tentar raspar.
 */
function idIndice(telefoneNormalizado: string): string {
  return createHash("sha256").update(telefoneNormalizado).digest("hex").slice(0, 32);
}

/** Total de clientes distintos já atendidos. Custo: 1 leitura. */
export async function lerTotalClientes(): Promise<number> {
  try {
    const db = getAdminDb();
    const snap = await db.collection(META_COL).doc(META_DOC).get();
    const total = (snap.data() as ContadorDoc | undefined)?.total;
    return typeof total === "number" && total > 0 ? total : 0;
  } catch {
    return 0; // landing nunca quebra por causa de um número decorativo
  }
}

/**
 * Registra que um telefone foi atendido. Idempotente: chamar de novo para o mesmo
 * telefone não mexe no total.
 *
 * Roda em transação porque dois atendimentos do mesmo cliente finalizados ao mesmo
 * tempo (admin + comanda, por exemplo) poderiam ler "não existe" juntos e somar 2.
 * Nunca lança pra fora — é contador decorativo, não pode derrubar a conclusão de um
 * atendimento.
 */
export async function registrarClienteAtendido(telefone: string): Promise<void> {
  const tel = normalizarTelefone(telefone);
  if (tel.length < 8) return; // telefone inválido/vazio não vira cliente

  try {
    const db = getAdminDb();
    const idxRef = db.collection(IDX_COL).doc(idIndice(tel));
    const metaRef = db.collection(META_COL).doc(META_DOC);

    await db.runTransaction(async (tx) => {
      const idx = await tx.get(idxRef);
      if (idx.exists) return; // cliente recorrente — já foi contado
      tx.set(idxRef, { primeiroEm: Date.now() });
      tx.set(metaRef, { total: FieldValue.increment(1), atualizadoEm: Date.now() }, { merge: true });
    });
  } catch {
    // best-effort: se falhar, o backfill reconstrói
  }
}

/**
 * Mesma coisa, partindo do ID do agendamento — usado no fluxo da comanda, que não
 * guarda telefone. Custo: 1 leitura extra, só quando uma comanda é finalizada.
 */
export async function registrarClientePorAgendamento(agendamentoId: string): Promise<void> {
  if (!agendamentoId) return;
  try {
    const db = getAdminDb();
    const snap = await db.collection("agendamentos").doc(agendamentoId).get();
    const tel = snap.data()?.telefone;
    if (typeof tel === "string") await registrarClienteAtendido(tel);
  } catch {
    // best-effort
  }
}
