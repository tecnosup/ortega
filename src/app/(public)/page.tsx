import Hero from "@/components/landing/Hero";
import Sobre from "@/components/landing/Sobre";
import Servicos from "@/components/landing/Servicos";
import Produtos from "@/components/landing/Produtos";
import Assinaturas from "@/components/landing/Assinaturas";
import Depoimentos from "@/components/landing/Depoimentos";
import Localizacao from "@/components/landing/Localizacao";
import CtaFinal from "@/components/landing/CtaFinal";
import CtaMobileFloat from "@/components/landing/CtaMobileFloat";
import { getLandingSettings } from "@/lib/admin-settings";
import { getPublishedItems } from "@/lib/admin-items";
import { getPublishedProdutos } from "@/lib/admin-produtos";
import { getActiveDescontos } from "@/lib/admin-descontos";
import { getCategorias } from "@/lib/admin-categorias";
import { getCategoriasServicos } from "@/lib/admin-categorias-servicos";
import type { Desconto } from "@/lib/admin-descontos";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, items, produtos, descontosList, categorias, categoriasServicos] = await Promise.all([
    getLandingSettings().catch(() => ({
      heroTitulo: "Ortega",
      heroSubtitulo: "Tradição e estilo em cada corte",
      heroImagemFundo: "",
      heroImagemRetrato: "",
      sobreTexto: "",
      sobreImagem: "",
      whatsappNumber: "5512982585538",
      emailContato: "",
      enderecoTexto: "",
      enderecoEmbed: "",
    })),
    getPublishedItems().catch(() => []),
    getPublishedProdutos().catch(() => []),
    getActiveDescontos().catch(() => []),
    getCategorias().catch(() => []),
    getCategoriasServicos().catch(() => []),
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
      <Servicos items={items} descontos={descontos} categorias={categoriasServicos} />
      <Produtos produtos={produtos} descontos={descontos} whatsappNumber={settings.whatsappNumber} categorias={categorias} />
      <Assinaturas />
      <Depoimentos />
      <Localizacao enderecoTexto={settings.enderecoTexto} enderecoEmbed={settings.enderecoEmbed} />
      <CtaFinal />
      <CtaMobileFloat whatsappNumber={settings.whatsappNumber} />
    </>
  );
}
