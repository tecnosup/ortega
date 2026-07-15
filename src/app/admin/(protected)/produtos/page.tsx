import { getProdutos } from "@/lib/admin-produtos";
import { IconShoppingBag } from "@tabler/icons-react";
import { getCategorias } from "@/lib/admin-categorias";
import ProdutosList from "./ProdutosList";
import CategoriasInline from "./CategoriasInline";
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

      <CategoriasInline categorias={categorias} />

      <ProdutosList produtos={produtos} categorias={categorias} />

      <EstoqueMovimentacoes produtos={produtos} />
    </div>
  );
}
