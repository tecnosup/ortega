import { notFound } from "next/navigation";
import { getProdutoById } from "@/lib/admin-produtos";
import { getCategorias } from "@/lib/admin-categorias";
import { updateProdutoAction } from "../../actions";
import ProdutoForm from "../../ProdutoForm";

export const dynamic = "force-dynamic";

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [produto, categorias] = await Promise.all([
    getProdutoById(id).catch(() => null),
    getCategorias().catch(() => []),
  ]);

  if (!produto) notFound();

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5E6C8]">Editar produto</h1>
      <ProdutoForm action={updateProdutoAction} produto={produto} categorias={categorias} submitLabel="Salvar alterações" />
    </div>
  );
}
