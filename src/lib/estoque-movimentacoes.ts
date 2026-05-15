import { getAdminDb } from "./firebase-admin";
import type { MovimentacaoEstoque } from "./estoque-movimentacoes-tipos";

export type { TipoMovimentacao, MovimentacaoEstoque } from "./estoque-movimentacoes-tipos";
export { TIPO_LABEL } from "./estoque-movimentacoes-tipos";

export async function getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("estoque_movimentacoes")
    .orderBy("criadoEm", "desc")
    .limit(200)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MovimentacaoEstoque));
}

export async function criarMovimentacao(
  data: Omit<MovimentacaoEstoque, "id" | "criadoEm">
): Promise<string> {
  const db = getAdminDb();
  const clean = Object.fromEntries(
    Object.entries({ ...data, criadoEm: Date.now() }).filter(([, v]) => v !== undefined)
  );
  const ref = await db.collection("estoque_movimentacoes").add(clean);
  return ref.id;
}
