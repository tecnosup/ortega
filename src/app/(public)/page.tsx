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
import { lerTotalClientes } from "@/lib/clientes-agg";
import type { Desconto } from "@/lib/admin-descontos";
import { ASSINATURAS_ATIVAS, REVIEWS_ATIVOS } from "@/lib/flags";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, items, produtos, descontosList, categorias, categoriasServicos, totalClientes] = await Promise.all([
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
    // 1 leitura de doc, e só quando o ISR revalida (60s) — não por visita.
    lerTotalClientes(),
  ]);

  const descontos = new Map<string, Desconto>(descontosList.map((d) => [d.entityId, d]));

  // Peça em destaque (opcional): só resolve se o admin ativou E escolheu uma peça
  // publicada. Busca no catálogo já carregado — sem query extra.
  const destaque = (() => {
    if (!("destaqueAtivo" in settings) || !settings.destaqueAtivo || !settings.destaqueId) return null;
    if (settings.destaqueTipo === "servico") {
      const s = items.find((i) => i.id === settings.destaqueId);
      return s ? { titulo: s.titulo, preco: s.preco, imagem: s.imagem, tipo: "servico" as const } : null;
    }
    if (settings.destaqueTipo === "produto") {
      const p = produtos.find((x) => x.id === settings.destaqueId);
      return p ? { titulo: p.titulo, preco: p.preco, imagem: p.imagem, tipo: "produto" as const } : null;
    }
    return null;
  })();

  return (
    <>
      <Hero
        titulo={settings.heroTitulo}
        subtitulo={settings.heroSubtitulo}
        whatsappNumber={settings.whatsappNumber}
        imagemFundo={settings.heroImagemFundo}
        imagemRetrato={settings.heroImagemRetrato}
        destaque={destaque}
      />
      <Sobre texto={settings.sobreTexto} imagem={settings.sobreImagem} clientes={totalClientes} />
      <Servicos items={items} descontos={descontos} categorias={categoriasServicos} />
      <Produtos produtos={produtos} descontos={descontos} whatsappNumber={settings.whatsappNumber} categorias={categorias} />
      {ASSINATURAS_ATIVAS && <Assinaturas />}
      {REVIEWS_ATIVOS && <Depoimentos />}
      <Localizacao enderecoTexto={settings.enderecoTexto} enderecoEmbed={settings.enderecoEmbed} />
      <CtaFinal />
      <CtaMobileFloat whatsappNumber={settings.whatsappNumber} />
    </>
  );
}
