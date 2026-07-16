"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createDesconto, updateDesconto, deleteDesconto, getDescontoById } from "@/lib/admin-descontos";
import { logAudit } from "@/lib/audit";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

// As mensagens são exibidas direto pro admin no rodapé do formulário — sem elas,
// o zod devolve o texto padrão em inglês ("Too small: expected string to have >=1
// characters"), que não diz o que fazer.
const schema = z.object({
  tipo: z.enum(["item", "produto"], { message: "Escolha entre serviço e produto" }),
  entityId: z.string().min(1, "Selecione o serviço ou produto do desconto"),
  entityTitulo: z.string().min(1, "Selecione o serviço ou produto do desconto"),
  percentual: z.coerce.number({ message: "Informe o desconto" }).min(1, "O desconto deve ser de no mínimo 1%").max(100, "O desconto deve ser de no máximo 100%"),
  // datetime-local vem como "2026-05-04T10:00" — converte para ms
  inicioAt: z.string().min(1, "Informe a data de início").transform((v) => new Date(v).getTime()),
  fimAt: z.string().min(1, "Informe a data de fim").transform((v) => new Date(v).getTime()),
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
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
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
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
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
