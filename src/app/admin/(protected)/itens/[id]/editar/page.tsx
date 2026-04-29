"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { demoServicos } from "@/lib/demo-data";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition";

export default function EditarItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const item = demoServicos.find((s) => s.id === id);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 400));
    setSalvando(false);
    router.push("/admin/itens");
  }

  if (!item) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-gray-500 text-sm">Serviço não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5E6C8]">Editar serviço</h1>

      <p className="text-sm text-[#b8944a]/80 bg-[#b8944a]/10 border border-[#b8944a]/20 rounded-lg px-4 py-2.5">
        Modo demo — alterações não são persistidas. Conecte o Firestore para salvar de verdade.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Título *</label>
          <input name="titulo" defaultValue={item.titulo} required className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Descrição</label>
          <textarea name="descricao" rows={3} defaultValue={item.descricao} className={`${inp} resize-none`} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Preço</label>
          <input name="preco" defaultValue={item.preco} className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Duração</label>
          <input name="duracao" defaultValue={item.duracao} className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Status</label>
          <select name="status" defaultValue={item.status} className={inp}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Ordem</label>
          <input name="order" type="number" defaultValue={item.order} className={inp} />
        </div>
        <button
          type="submit"
          disabled={salvando}
          className="py-3 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
