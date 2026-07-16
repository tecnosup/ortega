"use client";

import { useState } from "react";
import { IconTag } from "@tabler/icons-react";
import type { Categoria } from "@/lib/admin-categorias";
import CategoriasPainel from "@/components/admin/CategoriasPainel";
import Revelar from "@/components/ui/Revelar";
import { reorderCategoriasAction } from "./actions";

export default function CategoriasInline({
  categorias,
  onCategorias,
  acao,
}: {
  categorias: Categoria[];
  /** Sobe a lista atualizada: o pai também usa as categorias no select do produto. */
  onCategorias: (cats: Categoria[]) => void;
  // Botão do dono da tela (ex.: "Novo produto"), renderizado na mesma linha do
  // trigger. Sem isso os dois ficam em componentes irmãos e não há CSS que os
  // alinhe: um preso à esquerda de uma linha, o outro à direita da seguinte.
  acao?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* linha de ações — no mobile os dois dividem a largura; a partir de sm
          voltam à largura natural. */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm rounded border whitespace-nowrap transition ${open ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-[#2d2d2d] text-gray-400 hover:border-[#b8944a] hover:text-[#b8944a]"}`}
        >
          <IconTag size={14} /> Categorias
        </button>
        {acao}
      </div>

      <Revelar show={open}>
        <CategoriasPainel
          titulo="Categorias de produtos"
          placeholder="Ex: Pomadas, Shampoos…"
          endpoint="/api/admin/categorias"
          categorias={categorias}
          onChange={(cats) => onCategorias(cats as Categoria[])}
          onReorder={reorderCategoriasAction}
        />
      </Revelar>
    </div>
  );
}
