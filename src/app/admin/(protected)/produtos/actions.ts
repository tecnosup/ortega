"use server";

import { updateProduto, deleteProduto, getProdutoById } from "@/lib/admin-produtos";
import { excluirMovimentacoesDoProduto } from "@/lib/estoque-movimentacoes";
import { logAudit } from "@/lib/audit";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

async function getActor() {
  const cookieStore = await cookies();
  const session = cookieStore.get("base_admin_session")?.value ?? "";
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return { actorUid: decoded.uid, actorEmail: decoded.email ?? null };
  } catch {
    return { actorUid: "unknown", actorEmail: null };
  }
}

// Criar/editar produto passou a ser feito pelo ProdutoModal, via rotas
// /api/admin/produtos. As actions de criação/edição foram removidas junto com
// as páginas /produtos/novo e /produtos/[id]/editar, que ninguém linkava.
export async function deleteProdutoAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const id = formData.get("id") as string;
  // se "1", apaga também o histórico de movimentações de estoque do produto
  // (senão elas ficam órfãs no painel de estoque, mostrando produto inexistente)
  const apagarHistorico = formData.get("apagarHistorico") === "1";
  let before: Awaited<ReturnType<typeof getProdutoById>> = null;
  try {
    before = await getProdutoById(id);
    await deleteProduto(id);
    if (apagarHistorico) await excluirMovimentacoesDoProduto(id).catch(() => {});
  } catch {
    return { ok: false, error: "Erro ao remover produto" };
  }
  try {
    const actor = await getActor();
    await logAudit({
      ...actor,
      action: "produto.delete",
      entity: "produto",
      entityId: id,
      summary: `Produto "${(before as { titulo?: string })?.titulo ?? id}" deletado${apagarHistorico ? " (com histórico de estoque)" : ""}`,
      snapshot: before ?? undefined,
      snapshotAntes: before ?? undefined,
    });
  } catch { /* auditoria não bloqueia a operação */ }
  return { ok: true };
}

export async function toggleStatusAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const id = formData.get("id") as string;
  const current = formData.get("status") as string;
  const next = current === "published" ? "draft" : "published";
  try {
    const actor = await getActor();
    await updateProduto(id, { status: next });
    await logAudit({ ...actor, action: "produto.update", entity: "produto", entityId: id, summary: `Status alterado para ${next}` });
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao alterar status" };
  }
}

export async function reorderProdutosAction(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = adminDb;
    const batch = db.batch();
    ids.forEach((id, index) => {
      batch.update(db.collection("produtos").doc(id), { order: index, updatedAt: Date.now() });
    });
    await batch.commit();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao reordenar" };
  }
}

// Ordem das abas de categoria na landing. getCategorias() já faz orderBy("order")
// e a landing preserva a ordem do array, então gravar o índice aqui basta.
export async function reorderCategoriasAction(ids: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = adminDb;
    const batch = db.batch();
    ids.forEach((id, index) => {
      batch.update(db.collection("categoriasProdutos").doc(id), { order: index });
    });
    await batch.commit();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao reordenar categorias" };
  }
}

export async function revertAuditAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const logId = formData.get("logId") as string;
  const actor = await getActor();

  try {
    const logDoc = await adminDb.collection("auditLogs").doc(logId).get();
    if (!logDoc.exists) return { ok: false, error: "Log não encontrado" };

    const log = logDoc.data() as {
      action: string;
      entity: string;
      entityId: string;
      snapshotAntes?: Record<string, unknown>;
      snapshot?: Record<string, unknown>;
    };

    const { action, entity, entityId, snapshotAntes } = log;

    if (!snapshotAntes) return { ok: false, error: "Este log não possui dados para reversão" };

    const collection = entity === "produto" ? "produtos" : entity === "item" ? "servicos" : null;
    if (!collection) return { ok: false, error: "Entidade não suportada para reversão" };

    if (action.endsWith(".delete")) {
      const { id: _id, ...data } = snapshotAntes as { id?: string } & Record<string, unknown>;
      await adminDb.collection(collection).doc(entityId).set({ ...data, updatedAt: Date.now() });
    } else if (action.endsWith(".update") || action.endsWith(".create")) {
      await adminDb.collection(collection).doc(entityId).update({ ...snapshotAntes, updatedAt: Date.now() });
    }

    await logAudit({
      ...actor,
      action: `${action}.revert`,
      entity,
      entityId,
      snapshot: snapshotAntes,
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Erro ao reverter ação" };
  }
}
