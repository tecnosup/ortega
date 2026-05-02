import Hero from "@/components/landing/Hero";
import Sobre from "@/components/landing/Sobre";
import Servicos from "@/components/landing/Servicos";
import Depoimentos from "@/components/landing/Depoimentos";
import CtaFinal from "@/components/landing/CtaFinal";
import { getLandingSettings } from "@/lib/admin-settings";
import { getPublishedItems } from "@/lib/admin-items";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, items] = await Promise.all([
    getLandingSettings(),
    getPublishedItems(),
  ]);

  return (
    <>
      <Hero
        titulo={settings.heroTitulo}
        subtitulo={settings.heroSubtitulo}
        whatsappNumber={settings.whatsappNumber}
      />
      <Sobre texto={settings.sobreTexto} />
      <Servicos items={items} />
      <Depoimentos />
      <CtaFinal />
    </>
  );
}
