import { adminDb } from "./firebase-admin";

export interface LandingSettings {
  heroTitulo: string;
  heroSubtitulo: string;
  sobreTexto: string;
  whatsappNumber: string;
  emailContato: string;
}

const DEFAULTS: LandingSettings = {
  heroTitulo: "Você mais bonito",
  heroSubtitulo: "Cortes precisos, barba impecável e atendimento exclusivo. Na Ortega, cada detalhe importa.",
  sobreTexto:
    "A Ortega Barber nasceu da paixão pelo artesanato da barbearia tradicional aliado ao estilo contemporâneo. Em nosso espaço, você encontra profissionais dedicados, ambiente premium e os melhores produtos do mercado.",
  whatsappNumber: "5512982585538",
  emailContato: "contato@ortegabarber.com.br",
};

export async function getLandingSettings(): Promise<LandingSettings> {
  const doc = await adminDb.collection("settings").doc("landing").get();
  if (!doc.exists) return DEFAULTS;
  return { ...DEFAULTS, ...(doc.data() as Partial<LandingSettings>) };
}

export async function updateLandingSettings(data: Partial<LandingSettings>) {
  await adminDb.collection("settings").doc("landing").set(data, { merge: true });
}
