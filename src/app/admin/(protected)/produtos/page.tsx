import { getProdutos } from "@/lib/admin-produtos";
import { getCategorias } from "@/lib/admin-categorias";
import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Produtos</h1>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          <Plus size={16} /> Novo produto
        </Link>
      </div>

      <CategoriasInline categorias={categorias} />

      <ProdutosList produtos={produtos} categorias={categorias} />

      <EstoqueMovimentacoes produtos={produtos} />
    </div>
  );
}
