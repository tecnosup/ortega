import { getItems } from "@/lib/admin-items";
import { deleteItemAction } from "./actions";
import Link from "next/link";
import { Plus, Edit2, Trash2, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ItensPage() {
  const items = await getItems();

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Serviços</h1>
        </div>
        <Link
          href="/admin/itens/novo"
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          <Plus size={16} /> Novo serviço
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum serviço cadastrado.</p>
      ) : (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg divide-y divide-[#1a1a1a]">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#151515] transition">
              <div>
                <p className="font-semibold text-[#F5E6C8] text-sm">{item.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className={item.status === "published" ? "text-green-400" : "text-gray-600"}>
                    {item.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                  {item.preco ? <span> · <span className="text-[#b8944a]">R$ {item.preco}</span></span> : ""}
                  {item.duracao ? ` · ${item.duracao}` : ""}
                  {` · ordem ${item.order}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/itens/${item.id}/editar`}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition"
                >
                  <Edit2 size={12} /> Editar
                </Link>
                <form action={deleteItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    onClick={(e) => { if (!confirm("Remover este serviço?")) e.preventDefault(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-500 text-xs rounded hover:border-red-700 hover:text-red-400 transition"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
