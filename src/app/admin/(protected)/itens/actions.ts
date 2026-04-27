"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createItem, updateItem, deleteItem } from "@/lib/admin-items";
import { logAudit } from "@/lib/audit";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

const schema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  imagem: z.string().default(""),
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

export async function createItemAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const actor = await getActor();
  const id = await createItem(parsed.data);
  await logAudit({ ...actor, action: "item.create", entity: "item", entityId: id });
  redirect("/admin/itens");
}

export async function updateItemAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const actor = await getActor();
  await updateItem(id, parsed.data);
  await logAudit({ ...actor, action: "item.update", entity: "item", entityId: id });
  redirect("/admin/itens");
}

export async function deleteItemAction(formData: FormData) {
  const id = formData.get("id") as string;
  const actor = await getActor();
  await deleteItem(id);
  await logAudit({ ...actor, action: "item.delete", entity: "item", entityId: id });
  redirect("/admin/itens");
}
