import { Tag } from "lucide-react";
import { getCategorias } from "@/lib/admin-categorias";
import CategoriasClient from "./CategoriasClient";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categorias = await getCategorias().catch(() => []);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Tag size={22} className="text-[#b8944a]" />
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Categorias de produtos</h1>
      </div>

      <CategoriasClient categorias={categorias} />
    </div>
  );
}
