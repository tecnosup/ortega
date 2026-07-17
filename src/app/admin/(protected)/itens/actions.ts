"use server";

import { adminDb } from "@/lib/firebase-admin";

// Criar/editar/remover serviço passou a ser feito pelo drawer da lista, via
// rotas /api/admin/itens. Sobrou aqui só a reordenação, que a lista chama
// direto como server action.
export async function reorderItensAction(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = adminDb;
    const batch = db.batch();
    ids.forEach((id, index) => {
      batch.update(db.collection("servicos").doc(id), { order: index, updatedAt: Date.now() });
    });
    await batch.commit();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao reordenar" };
  }
}

// Ordem das abas de categoria na seção de Serviços da landing. Espelha
// reorderCategoriasAction (produtos), só muda a coleção.
export async function reorderCategoriasServicosAction(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = adminDb;
    const batch = db.batch();
    ids.forEach((id, index) => {
      batch.update(db.collection("categoriasServicos").doc(id), { order: index });
    });
    await batch.commit();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao reordenar categorias" };
  }
}
