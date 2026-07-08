import { getCategorias } from "@/lib/admin-categorias";
import {
  IconArrowLeft,
} from "@tabler/icons-react";
import { createProdutoAction } from "../actions";
import ProdutoForm from "../ProdutoForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  const categorias = await getCategorias().catch(() => []);

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/produtos" className="p-1.5 text-gray-500 hover:text-[#b8944a] transition">
          <IconArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Novo produto</h1>
      </div>
      <ProdutoForm action={createProdutoAction} categorias={categorias} submitLabel="Salvar produto" />
    </div>
  );
}
