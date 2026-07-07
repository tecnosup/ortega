"use server";

import { z } from "zod";
import { updateLandingSettings } from "@/lib/admin-settings";
import { logAudit } from "@/lib/audit";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

// Schema das configurações do app — usado pela página Configurações
const appConfigSchema = z.object({
  autoConfirmMode: z.enum(["manual", "tempo", "automatico"]).default("manual"),
  autoConfirmMinutos: z.coerce.number().int().min(1).max(1440).default(20),
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

type ActionResult = { ok: true } | { ok: false; error: string } | null;

// Página Configurações (app) — salva só as configs de funcionamento do sistema
export async function saveConfiguracoesAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = appConfigSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };
  try {
    await updateLandingSettings(parsed.data);
    const actor = await getActor();
    await logAudit({ ...actor, action: "settings.update", entity: "settings", entityId: "app-config" });
  } catch {
    return { ok: false, error: "Erro ao salvar. Tente novamente." };
  }
  return { ok: true };
}
