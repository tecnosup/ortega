"use server";

import { z } from "zod";
import { updateLandingSettings } from "@/lib/admin-settings";

const schema = z.object({
  heroTitulo: z.string().min(1),
  heroSubtitulo: z.string().min(1),
  sobreTexto: z.string().min(1),
  whatsappNumber: z.string().default(""),
  emailContato: z.string().default(""),
});

type ActionResult = { ok: true } | { ok: false; error: string } | null;

export async function updateSettingsAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };
  await updateLandingSettings(parsed.data);
  return { ok: true };
}
