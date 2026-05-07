import { adminDb } from "./firebase-admin";

export interface LandingSettings {
  heroTitulo: string;
  heroSubtitulo: string;
  heroImagemFundo: string;
  heroImagemRetrato: string;
  sobreTexto: string;
  sobreImagem: string;
  whatsappNumber: string;
  emailContato: string;
}

const DEFAULTS: LandingSettings = {
  heroTitulo: "Você mais bonito",
  heroSubtitulo: "Cortes precisos, barba impecável e atendimento exclusivo. Na Ortega, cada detalhe importa.",
  heroImagemFundo: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=85",
  heroImagemRetrato: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=85",
  sobreTexto:
    "A Ortega Barber nasceu da paixão pelo artesanato da barbearia tradicional aliado ao estilo contemporâneo. Em nosso espaço, você encontra profissionais dedicados, ambiente premium e os melhores produtos do mercado.",
  sobreImagem: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
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
