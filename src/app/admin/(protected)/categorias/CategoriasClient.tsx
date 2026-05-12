"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { createCategoriaAction, updateCategoriaAction, deleteCategoriaAction } from "./actions";
import type { Categoria } from "@/lib/admin-categorias";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition w-full";

export default function CategoriasClient({ categorias: initial }: { categorias: Categoria[] }) {
  const [categorias, setCategorias] = useState(initial);
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Categoria | null>(null);

  async function handleCreate() {
    if (!novoNome.trim()) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("nome", novoNome.trim());
    const result = await createCategoriaAction(fd);
    if (result.ok) {
      setNovoNome("");
      setCriando(false);
      window.location.reload();
    } else {
      setError(result.error ?? "Erro");
    }
    setLoading(false);
  }

  async function handleUpdate(id: string) {
    if (!editNome.trim()) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("id", id);
    fd.append("nome", editNome.trim());
    const result = await updateCategoriaAction(fd);
    if (result.ok) {
      setCategorias((prev) => prev.map((c) => c.id === id ? { ...c, nome: editNome.trim() } : c));
      setEditandoId(null);
    } else {
      setError(result.error ?? "Erro");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("id", id);
    const result = await deleteCategoriaAction(fd);
    if (result.ok) {
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      setDeleteModal(null);
    } else {
      setError(result.error ?? "Erro");
    }
    setLoading(false);
  }

  return (
    <>
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDeleteModal(null)}>
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#F5E6C8] font-semibold">Remover categoria?</h2>
            <p className="text-sm text-gray-400">
              A categoria <span className="text-[#F5E6C8] font-medium">"{deleteModal.nome}"</span> será removida.
              Os produtos vinculados a ela <span className="text-[#F5E6C8]">não serão deletados</span>, apenas perderão a categoria.
            </p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-gray-500 transition">Cancelar</button>
              <button onClick={() => handleDelete(deleteModal.id)} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-red-700 rounded-lg hover:bg-red-600 transition disabled:opacity-50">
                {loading ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {categorias.length === 0 && !criando && (
          <p className="text-gray-500 text-sm">Nenhuma categoria criada ainda.</p>
        )}

        {categorias.length > 0 && (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-lg divide-y divide-[#1a1a1a]">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#151515] transition gap-3">
                {editandoId === cat.id ? (
                  <input
                    autoFocus
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(cat.id); if (e.key === "Escape") setEditandoId(null); }}
                    className={inp}
                  />
                ) : (
                  <span className="text-sm text-[#F5E6C8]">{cat.nome}</span>
                )}

                <div className="flex gap-2 shrink-0">
                  {editandoId === cat.id ? (
                    <>
                      <button onClick={() => handleUpdate(cat.id)} disabled={loading} className="p-1.5 text-green-400 hover:text-green-300 transition">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditandoId(null)} className="p-1.5 text-gray-500 hover:text-gray-300 transition">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditandoId(cat.id); setEditNome(cat.nome); }} className="p-1.5 text-gray-500 hover:text-[#b8944a] transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteModal(cat)} className="p-1.5 text-gray-500 hover:text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {criando ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setCriando(false); setNovoNome(""); } }}
              placeholder="Nome da categoria..."
              className={inp}
            />
            <button onClick={handleCreate} disabled={loading || !novoNome.trim()} className="px-4 py-2 bg-[#b8944a] text-black text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50 shrink-0">
              {loading ? "..." : "Criar"}
            </button>
            <button onClick={() => { setCriando(false); setNovoNome(""); }} className="px-3 py-2 border border-[#2d2d2d] text-gray-500 text-sm rounded hover:border-gray-500 transition shrink-0">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setCriando(true)} className="self-start flex items-center gap-2 px-4 py-2 border border-[#2d2d2d] text-gray-400 text-sm rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition">
            <Plus size={14} /> Nova categoria
          </button>
        )}

        {error && !deleteModal && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </>
  );
}
