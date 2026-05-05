import { getProdutos } from "@/lib/admin-produtos";
import Link from "next/link";
import { Plus, Edit2, ShoppingBag } from "lucide-react";
import DeleteProdutoButton from "./DeleteProdutoButton";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const produtos = await getProdutos().catch(() => []);

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

      {produtos.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum produto cadastrado.</p>
      ) : (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg divide-y divide-[#1a1a1a]">
          {produtos.map((produto) => (
            <div key={produto.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#151515] transition">
              <div className="flex items-center gap-3">
                {produto.imagem && (
                  <img src={produto.imagem} alt={produto.titulo} className="w-10 h-10 object-cover rounded border border-[#2d2d2d] shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-[#F5E6C8] text-sm">{produto.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className={produto.status === "published" ? "text-green-400" : "text-gray-600"}>
                      {produto.status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                    {produto.preco ? <span> · <span className="text-[#b8944a]">R$ {produto.preco}</span></span> : ""}
                    {` · ordem ${produto.order}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/admin/produtos/${produto.id}/editar`}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition"
                >
                  <Edit2 size={12} /> Editar
                </Link>
                <DeleteProdutoButton id={produto.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
