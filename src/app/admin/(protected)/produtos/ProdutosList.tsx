"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Edit2, Trash2, GripVertical, ShoppingBag } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteProdutoAction, toggleStatusAction, reorderProdutosAction } from "./actions";
import type { Produto } from "@/lib/admin-produtos";
import type { Categoria } from "@/lib/admin-categorias";

function StatusToggle({ produto }: { produto: Produto }) {
  const [status, setStatus] = useState(produto.status);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const fd = new FormData();
    fd.append("id", produto.id);
    fd.append("status", status);
    const result = await toggleStatusAction(fd);
    if (result.ok) setStatus((s) => s === "published" ? "draft" : "published");
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={status === "published" ? "Clique para tornar rascunho" : "Clique para publicar"}
      className={`text-xs px-2 py-0.5 rounded-full border transition disabled:opacity-40 ${
        status === "published"
          ? "border-green-800 text-green-400 bg-green-950 hover:bg-green-900"
          : "border-[#2d2d2d] text-gray-600 bg-transparent hover:border-gray-500 hover:text-gray-400"
      }`}
    >
      {status === "published" ? "Publicado" : "Rascunho"}
    </button>
  );
}

function DeleteModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    const fd = new FormData();
    fd.append("id", produto.id);
    try {
      await deleteProdutoAction(fd);
    } catch {
      setError("Erro ao remover produto");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          {produto.imagem && <img src={produto.imagem} alt={produto.titulo} className="w-12 h-12 object-cover rounded border border-[#2d2d2d] shrink-0" />}
          <div>
            <h2 className="text-[#F5E6C8] font-semibold">Remover produto?</h2>
            <p className="text-sm text-gray-400 mt-0.5">"{produto.titulo}" será removido permanentemente.</p>
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-gray-500 transition">Cancelar</button>
          <button onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-red-700 rounded-lg hover:bg-red-600 transition disabled:opacity-50">
            {loading ? "Removendo..." : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableRow({ produto, categoriaMap, onDelete }: { produto: Produto; categoriaMap: Map<string, string>; onDelete: (p: Produto) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: produto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const categoriaNome = produto.categoriaId ? categoriaMap.get(produto.categoriaId) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#151515] transition border-b border-[#1a1a1a] last:border-0"
    >
      <button {...attributes} {...listeners} className="text-gray-700 hover:text-gray-400 transition cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical size={16} />
      </button>

      <div className="w-14 h-14 shrink-0 rounded border border-[#2d2d2d] overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.titulo} className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag size={20} className="text-[#2d2d2d]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#F5E6C8] text-sm truncate">{produto.titulo}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {produto.preco && <span className="text-xs text-[#b8944a]">R$ {produto.preco}</span>}
          {categoriaNome && <span className="text-xs text-gray-600">· {categoriaNome}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <StatusToggle produto={produto} />
        <Link
          href={`/admin/produtos/${produto.id}/editar`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition"
        >
          <Edit2 size={12} /> Editar
        </Link>
        <button
          onClick={() => onDelete(produto)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#2d2d2d] text-gray-500 text-xs rounded hover:border-red-700 hover:text-red-400 transition"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function ProdutosList({ produtos: initial, categorias }: { produtos: Produto[]; categorias: Categoria[] }) {
  const [produtos, setProdutos] = useState(initial);
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null);
  const [saving, setSaving] = useState(false);

  const categoriaMap = new Map(categorias.map((c) => [c.id, c.nome]));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = produtos.findIndex((p) => p.id === active.id);
    const newIndex = produtos.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(produtos, oldIndex, newIndex);
    setProdutos(reordered);

    setSaving(true);
    await reorderProdutosAction(reordered.map((p) => p.id));
    setSaving(false);
  }, [produtos]);

  if (produtos.length === 0) return <p className="text-gray-500 text-sm">Nenhum produto cadastrado.</p>;

  return (
    <>
      {deleteTarget && (
        <DeleteModal produto={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}

      {saving && (
        <p className="text-xs text-gray-500 text-right -mb-2">Salvando ordem...</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={produtos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="bg-[#111] border border-[#2d2d2d] rounded-lg overflow-hidden">
            {produtos.map((produto) => (
              <SortableRow
                key={produto.id}
                produto={produto}
                categoriaMap={categoriaMap}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
