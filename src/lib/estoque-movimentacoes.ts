import { getAdminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { MovimentacaoEstoque, TipoMovimentacao } from "./estoque-movimentacoes-tipos";

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

/**
 * Registra uma movimentação E aplica o delta no `estoque` do produto de forma
 * ATÔMICA (FieldValue.increment). `quantidade` já vem com sinal: negativo em
 * saída (venda), positivo em entrada (reposição/devolução). Retorna o novo
 * estoque resultante. É o que os botões −/+ do card de produto usam.
 */
export async function movimentarEstoque(params: {
  produtoId: string;
  produtoNome: string;
  produtoImagem?: string;
  tipo: TipoMovimentacao;
  quantidade: number; // com sinal
  obs?: string;
}): Promise<number> {
  const db = getAdminDb();
  const prodRef = db.collection("produtos").doc(params.produtoId);

  const novoEstoque = await db.runTransaction(async (tx) => {
    const snap = await tx.get(prodRef);
    if (!snap.exists) throw new Error("Produto não encontrado");
    const atual = (snap.data()?.estoque as number | undefined) ?? 0;
    // não deixa estoque negativo: uma saída maior que o saldo é barrada
    if (atual + params.quantidade < 0) {
      throw new Error(`Estoque insuficiente (disponível: ${atual}).`);
    }
    tx.update(prodRef, { estoque: FieldValue.increment(params.quantidade), updatedAt: Date.now() });
    const movRef = db.collection("estoque_movimentacoes").doc();
    const mov = {
      produtoId: params.produtoId,
      produtoNome: params.produtoNome,
      produtoImagem: params.produtoImagem,
      tipo: params.tipo,
      quantidade: params.quantidade,
      obs: params.obs,
      criadoEm: Date.now(),
    };
    tx.set(movRef, Object.fromEntries(Object.entries(mov).filter(([, v]) => v !== undefined)));
    return atual + params.quantidade;
  });

  return novoEstoque;
}

/** Remove todas as movimentações vinculadas a um produto (usado ao excluir o produto com histórico). */
export async function excluirMovimentacoesDoProduto(produtoId: string): Promise<number> {
  const db = getAdminDb();
  const snap = await db.collection("estoque_movimentacoes").where("produtoId", "==", produtoId).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}
