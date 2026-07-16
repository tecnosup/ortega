import { getProdutos } from "@/lib/admin-produtos";
import { IconShoppingBag } from "@tabler/icons-react";
import { getCategorias } from "@/lib/admin-categorias";
import ProdutosList from "./ProdutosList";
import EstoqueMovimentacoes from "./EstoqueMovimentacoes";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const [produtos, categorias] = await Promise.all([
    getProdutos().catch(() => []),
    getCategorias().catch(() => []),
  ]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconShoppingBag size={22} className="text-[#b8944a]" />
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Produtos</h1>
      </div>

      {/* Ordem: ações (Categorias / Novo produto) → movimentações → resumo → lista.
          As ações ficam no topo por serem o que se procura ao entrar. Movimentações
          vem logo abaixo: no fim da página ela afundava conforme cresciam categorias
          e produtos, e é informação de acompanhamento diário. */}
      <ProdutosList produtos={produtos} categorias={categorias}>
        <EstoqueMovimentacoes produtos={produtos} />
      </ProdutosList>
    </div>
  );
}
