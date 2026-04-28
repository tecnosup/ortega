export const dynamic = "force-dynamic";

import Link from "next/link";
import { getItems } from "@/lib/admin-items";
import { deleteItemAction } from "./actions";
import Button from "@/components/ui/Button";

export default async function ItensPage() {
  const items = await getItems();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <Link href="/admin/itens/novo">
          <Button>Novo serviço</Button>
        </Link>
      </div>

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
                <form action={deleteItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button variant="ghost" size="sm" type="submit">Excluir</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
