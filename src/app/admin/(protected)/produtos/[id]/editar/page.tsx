import { notFound } from "next/navigation";
import {
  IconArrowLeft,
} from "@tabler/icons-react";
import { getProdutoById } from "@/lib/admin-produtos";
import { getCategorias } from "@/lib/admin-categorias";
import { updateProdutoAction } from "../../actions";
import ProdutoForm from "../../ProdutoForm";
import Link from "next/link";

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
      <div className="flex items-center gap-3">
        <Link href="/admin/produtos" className="p-1.5 text-gray-500 hover:text-[#b8944a] transition">
          <IconArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Editar produto</h1>
      </div>
      <ProdutoForm action={updateProdutoAction} produto={produto} categorias={categorias} submitLabel="Salvar alterações" />
    </div>
  );
}
