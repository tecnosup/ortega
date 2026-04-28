"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// DEMO MODE: criação simulada — conectar ao Firestore na produção
export default function NovoItemPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 400));
    setSalvando(false);
    router.push("/admin/itens");
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Novo serviço</h1>
      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-6">
        Modo demo — serviço não será salvo. Conecte o Firestore para persistir.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input label="Título" name="titulo" required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descrição</label>
          <textarea name="descricao" rows={3} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a] resize-none" />
        </div>
        <Input label="Preço (ex: 55 ou A partir de R$ 120)" name="preco" />
        <Input label="Duração (ex: 45 min)" name="duracao" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select name="status" defaultValue="draft" className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]">
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>
        <Input label="Ordem" name="order" type="number" defaultValue={0} />
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
}
