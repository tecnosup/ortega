"use server";

import { z } from "zod";
import { updateLandingSettings } from "@/lib/admin-settings";
import { logAudit } from "@/lib/audit";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

const schema = z.object({
  heroTitulo: z.string().min(1),
  heroSubtitulo: z.string().min(1),
  heroImagemFundo: z.string().default(""),
  heroImagemRetrato: z.string().default(""),
  sobreTexto: z.string().min(1),
  sobreImagem: z.string().default(""),
  whatsappNumber: z.string().default(""),
  emailContato: z.string().default(""),
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

export async function saveConfiguracoesAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };
  try {
    await updateLandingSettings(parsed.data);
    const actor = await getActor();
    await logAudit({ ...actor, action: "settings.update", entity: "settings", entityId: "landing" });
  } catch {
    return { ok: false, error: "Erro ao salvar. Tente novamente." };
  }
  return { ok: true };
}

export const updateSettingsAction = saveConfiguracoesAction;
