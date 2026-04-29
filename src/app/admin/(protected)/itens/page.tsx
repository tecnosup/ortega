"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import Link from "next/link";
import type { Item } from "@/lib/admin-items";
import { demoServicos } from "@/lib/demo-data";
import Button from "@/components/ui/Button";

// DEMO MODE: serviços estáticos — conectar ao Firestore na produção
export default function ItensPage() {
  const [items, setItems] = useState<Item[]>(demoServicos);

  function excluir(id: string) {
    if (!confirm("Remover este serviço?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <Link href="/admin/itens/novo">
          <Button>Novo serviço</Button>
        </Link>
      </div>

      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-6">
        Modo demo — alterações não são persistidas. Conecte o Firestore para salvar de verdade.
      </p>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum serviço cadastrado.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.titulo}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.status === "published" ? "Publicado" : "Rascunho"}
                  {item.preco ? ` · R$ ${item.preco}` : ""}
                  {item.duracao ? ` · ${item.duracao}` : ""}
                  {` · ordem ${item.order}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/itens/${item.id}/editar`}>
                  <Button variant="secondary" size="sm">Editar</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => excluir(item.id)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
