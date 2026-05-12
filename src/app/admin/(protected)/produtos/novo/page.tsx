import { getCategorias } from "@/lib/admin-categorias";
import { createProdutoAction } from "../actions";
import ProdutoForm from "../ProdutoForm";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  const categorias = await getCategorias().catch(() => []);

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5E6C8]">Novo produto</h1>
      <ProdutoForm action={createProdutoAction} categorias={categorias} submitLabel="Salvar produto" />
    </div>
  );
}
