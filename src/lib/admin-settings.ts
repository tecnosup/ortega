import { adminDb } from "./firebase-admin";

export interface LandingSettings {
  heroTitulo: string;
  heroSubtitulo: string;
  sobreTexto: string;
  whatsappNumber: string;
  emailContato: string;
}

const DEFAULTS: LandingSettings = {
  heroTitulo: "Título principal aqui",
  heroSubtitulo: "Subtítulo de apoio aqui",
  sobreTexto:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  whatsappNumber: "",
  emailContato: "",
};

export async function getLandingSettings(): Promise<LandingSettings> {
  const doc = await adminDb.collection("settings").doc("landing").get();
  if (!doc.exists) return DEFAULTS;
  return { ...DEFAULTS, ...(doc.data() as Partial<LandingSettings>) };
}

export async function updateLandingSettings(data: Partial<LandingSettings>) {
  await adminDb.collection("settings").doc("landing").set(data, { merge: true });
}
