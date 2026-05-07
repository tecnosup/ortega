import Hero from "@/components/landing/Hero";
import Sobre from "@/components/landing/Sobre";
import Servicos from "@/components/landing/Servicos";
import Produtos from "@/components/landing/Produtos";
import Depoimentos from "@/components/landing/Depoimentos";
import CtaFinal from "@/components/landing/CtaFinal";
import { getLandingSettings } from "@/lib/admin-settings";
import { getPublishedItems } from "@/lib/admin-items";
import { getPublishedProdutos } from "@/lib/admin-produtos";
import { getActiveDescontos } from "@/lib/admin-descontos";
import type { Desconto } from "@/lib/admin-descontos";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, items, produtos, descontosList] = await Promise.all([
    getLandingSettings().catch(() => ({
      heroTitulo: "Ortega Barber",
      heroSubtitulo: "Tradição e estilo em cada corte",
      heroImagemFundo: "",
      heroImagemRetrato: "",
      sobreTexto: "",
      sobreImagem: "",
      whatsappNumber: "5512982585538",
      emailContato: "",
    })),
    getPublishedItems().catch(() => []),
    getPublishedProdutos().catch(() => []),
    getActiveDescontos().catch(() => []),
  ]);

  const descontos = new Map<string, Desconto>(descontosList.map((d) => [d.entityId, d]));

  return (
    <>
      <Hero
        titulo={settings.heroTitulo}
        subtitulo={settings.heroSubtitulo}
        whatsappNumber={settings.whatsappNumber}
        imagemFundo={settings.heroImagemFundo}
        imagemRetrato={settings.heroImagemRetrato}
      />
      <Sobre texto={settings.sobreTexto} imagem={settings.sobreImagem} />
      <Servicos items={items} descontos={descontos} />
      <Produtos produtos={produtos} descontos={descontos} whatsappNumber={settings.whatsappNumber} />
      <Depoimentos />
      <CtaFinal />
    </>
  );
}
