"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createDesconto, updateDesconto, deleteDesconto, getDescontoById } from "@/lib/admin-descontos";
import { logAudit } from "@/lib/audit";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

const schema = z.object({
  tipo: z.enum(["item", "produto"]),
  entityId: z.string().min(1),
  entityTitulo: z.string().min(1),
  percentual: z.coerce.number().min(1).max(100),
  // datetime-local vem como "2026-05-04T10:00" — converte para ms
  inicioAt: z.string().transform((v) => new Date(v).getTime()),
  fimAt: z.string().transform((v) => new Date(v).getTime()),
  ativo: z.string().transform((v) => v === "true"),
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

export async function createDescontoAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dados inválidos: " + parsed.error.issues[0]?.message };
  try {
    const actor = await getActor();
    const id = await createDesconto(parsed.data);
    await logAudit({ ...actor, action: "desconto.create", entity: "desconto", entityId: id, snapshot: parsed.data });
  } catch (e) {
    return { ok: false, error: `Erro ao salvar: ${e instanceof Error ? e.message : String(e)}` };
  }
  redirect("/admin/descontos");
}

export async function updateDescontoAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dados inválidos: " + parsed.error.issues[0]?.message };
  try {
    const actor = await getActor();
    const before = await getDescontoById(id);
    await updateDesconto(id, parsed.data);
    await logAudit({ ...actor, action: "desconto.update", entity: "desconto", entityId: id, snapshot: parsed.data, snapshotAntes: before ?? undefined });
  } catch (e) {
    return { ok: false, error: `Erro ao atualizar: ${e instanceof Error ? e.message : String(e)}` };
  }
  redirect("/admin/descontos");
}

export async function deleteDescontoAction(formData: FormData) {
  const id = formData.get("id") as string;
  try {
    const actor = await getActor();
    const before = await getDescontoById(id);
    await deleteDesconto(id);
    await logAudit({ ...actor, action: "desconto.delete", entity: "desconto", entityId: id, snapshot: before ?? undefined, snapshotAntes: before ?? undefined });
  } catch {
    // silencia
  }
  redirect("/admin/descontos");
}
