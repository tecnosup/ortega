"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { demoServicos } from "@/lib/demo-data";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// DEMO MODE: edição simulada — conectar ao Firestore na produção
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
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Editar serviço</h1>
      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-6">
        Modo demo — alterações não são persistidas. Conecte o Firestore para salvar de verdade.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input label="Título" name="titulo" defaultValue={item.titulo} required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descrição</label>
          <textarea name="descricao" rows={3} defaultValue={item.descricao} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a] resize-none" />
        </div>
        <Input label="Preço" name="preco" defaultValue={item.preco} />
        <Input label="Duração" name="duracao" defaultValue={item.duracao} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select name="status" defaultValue={item.status} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]">
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>
        <Input label="Ordem" name="order" type="number" defaultValue={item.order} />
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
}
