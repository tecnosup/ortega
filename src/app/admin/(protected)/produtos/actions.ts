"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createProduto, updateProduto, deleteProduto, getProdutoById } from "@/lib/admin-produtos";
import { logAudit } from "@/lib/audit";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

const schema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().default(""),
  imagem: z.string().default(""),
  preco: z.string().default(""),
  status: z.enum(["draft", "published"]),
  order: z.coerce.number().default(0),
});

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

type ActionResult = { ok: false; error: string } | null;

export async function createProdutoAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };
  try {
    const actor = await getActor();
    const id = await createProduto(parsed.data);
    await logAudit({
      ...actor,
      action: "produto.create",
      entity: "produto",
      entityId: id,
      snapshot: parsed.data,
    });
  } catch (e) {
    return { ok: false, error: `Erro ao salvar: ${e instanceof Error ? e.message : String(e)}` };
  }
  redirect("/admin/produtos");
}

export async function updateProdutoAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };
  try {
    const actor = await getActor();
    const before = await getProdutoById(id);
    await updateProduto(id, parsed.data);
    await logAudit({
      ...actor,
      action: "produto.update",
      entity: "produto",
      entityId: id,
      snapshot: parsed.data,
      snapshotAntes: before ?? undefined,
    });
  } catch {
    return { ok: false, error: "Erro ao atualizar. Tente novamente." };
  }
  redirect("/admin/produtos");
}

export async function deleteProdutoAction(formData: FormData) {
  const id = formData.get("id") as string;
  try {
    const actor = await getActor();
    const before = await getProdutoById(id);
    await deleteProduto(id);
    await logAudit({
      ...actor,
      action: "produto.delete",
      entity: "produto",
      entityId: id,
      snapshot: before ?? undefined,
      snapshotAntes: before ?? undefined,
    });
  } catch {
    // silencia erro de delete
  }
  redirect("/admin/produtos");
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
