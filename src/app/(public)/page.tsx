import Hero from "@/components/landing/Hero";
import Sobre from "@/components/landing/Sobre";
import Servicos from "@/components/landing/Servicos";
import Depoimentos from "@/components/landing/Depoimentos";
import CtaFinal from "@/components/landing/CtaFinal";
import { demoSettings, demoServicos } from "@/lib/demo-data";

export default function HomePage() {
  const settings = demoSettings;
  const items = demoServicos;

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
