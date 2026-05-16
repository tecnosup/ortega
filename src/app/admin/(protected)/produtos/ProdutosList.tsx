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

function DeleteModal({ produto, onClose, onDeleted }: { produto: Produto; onClose: () => void; onDeleted: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    const fd = new FormData();
    fd.append("id", produto.id);
    const result = await deleteProdutoAction(fd);
    if (result.ok) {
      onDeleted(produto.id);
    } else {
      setError(result.error ?? "Erro ao remover produto");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          {produto.imagem && <img src={produto.imagem} alt={produto.titulo} className="w-12 h-12 object-cover rounded border border-[#2d2d2d] shrink-0" loading="lazy" />}
          <div>
            <h2 className="text-[#F5E6C8] font-semibold">Remover "{produto.titulo}"?</h2>
            <p className="text-sm text-gray-500 mt-0.5">Esta ação é irreversível e não pode ser desfeita.</p>
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

function SortableRow({ produto, onDelete }: { produto: Produto; onDelete: (p: Produto) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: produto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-3 hover:bg-[#151515] transition border-b border-[#1a1a1a] last:border-0"
    >
      <button {...attributes} {...listeners} className="text-gray-700 hover:text-gray-400 transition cursor-grab active:cursor-grabbing shrink-0 touch-none">
        <GripVertical size={16} />
      </button>

      <div className="w-12 h-12 shrink-0 rounded border border-[#2d2d2d] overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.titulo} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <ShoppingBag size={18} className="text-[#2d2d2d]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-[#F5E6C8] text-sm sm:truncate line-clamp-2 sm:line-clamp-1">{produto.titulo}</p>
          {produto.estoque !== undefined && produto.estoque <= (produto.estoqueMinimo ?? 5) && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-400 font-medium">Estoque baixo</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {produto.preco && <span className="text-xs text-[#b8944a]">R$ {produto.preco}</span>}
          {produto.estoque !== undefined && <span className="text-xs text-gray-600">· {produto.estoque} un.</span>}
        </div>
        {/* Ações no mobile ficam abaixo do nome */}
        <div className="flex items-center gap-1.5 mt-2 sm:hidden">
          <StatusToggle produto={produto} />
          <Link
            href={`/admin/produtos/${produto.id}/editar`}
            className="flex items-center gap-1 px-2 py-1 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition"
          >
            <Edit2 size={11} /> Editar
          </Link>
          <button
            onClick={() => onDelete(produto)}
            className="flex items-center px-2 py-1 border border-[#2d2d2d] text-gray-500 text-xs rounded hover:border-red-700 hover:text-red-400 transition"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Ações no desktop ficam à direita */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
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

  const handleDragEndForGroup = useCallback(async (event: DragEndEvent, groupIds: string[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groupIds.indexOf(active.id as string);
    const newIndex = groupIds.indexOf(over.id as string);
    const reorderedGroupIds = arrayMove(groupIds, oldIndex, newIndex);

    // Reconstrói a lista global substituindo os itens do grupo na posição correta
    const reordered = produtos.map((p) => {
      const pos = reorderedGroupIds.indexOf(p.id);
      return pos !== -1 ? { ...p, _newOrder: pos } : p;
    });
    // Mantém a ordem relativa dos outros grupos e reposiciona os do grupo arrastado
    const groupSet = new Set(groupIds);
    const others = reordered.filter((p) => !groupSet.has(p.id));
    const groupReordered = reorderedGroupIds.map((id) => produtos.find((p) => p.id === id)!);

    // Intercala de volta na posição original do grupo
    const firstGroupIndex = produtos.findIndex((p) => groupSet.has(p.id));
    const final = [...produtos];
    let gi = 0;
    for (let i = firstGroupIndex; i < final.length && gi < groupReordered.length; i++) {
      if (groupSet.has(final[i].id)) {
        final[i] = groupReordered[gi++];
      }
    }

    setProdutos(final);
    setSaving(true);
    await reorderProdutosAction(final.map((p) => p.id));
    setSaving(false);
  }, [produtos]);

  function handleDeleted(id: string) {
    setProdutos((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
  }

  if (produtos.length === 0) return <p className="text-gray-500 text-sm">Nenhum produto cadastrado.</p>;

  // Agrupar por categoria mantendo a ordem global
  const grupos: { categoriaId: string | null; nome: string; itens: Produto[] }[] = [];
  const visto = new Set<string | null>();

  for (const p of produtos) {
    const cid = p.categoriaId ?? null;
    if (!visto.has(cid)) {
      visto.add(cid);
      grupos.push({
        categoriaId: cid,
        nome: cid ? (categoriaMap.get(cid) ?? "Sem categoria") : "Sem categoria",
        itens: [],
      });
    }
    grupos.find((g) => g.categoriaId === cid)!.itens.push(p);
  }

  return (
    <>
      {deleteTarget && (
        <DeleteModal produto={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      )}

      {saving && (
        <p className="text-xs text-gray-500 text-right -mb-2">Salvando ordem...</p>
      )}

      <div className="flex flex-col gap-4">
            {grupos.map((grupo) => {
              const groupIds = grupo.itens.map((p) => p.id);
              return (
              <div key={grupo.categoriaId ?? "__sem__"} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#b8944a]">
                    {grupo.nome}
                  </span>
                  <span className="text-[10px] text-gray-600">{grupo.itens.length} produto{grupo.itens.length !== 1 ? "s" : ""}</span>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEndForGroup(e, groupIds)}>
                  <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
                    <div className="bg-[#111] border border-[#2d2d2d] rounded-lg overflow-hidden">
                      {grupo.itens.map((produto) => (
                        <SortableRow
                          key={produto.id}
                          produto={produto}
                          onDelete={setDeleteTarget}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            );
            })}
          </div>
    </>
  );
}
