"use client";

import { useState } from "react";
import {
  IconCheck, IconEdit, IconLoader2, IconPlus, IconTag, IconTrash, IconX,
} from "@tabler/icons-react";
import type { Categoria } from "@/lib/admin-categorias";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition w-full";

export default function CategoriasInline({ categorias: initial }: { categorias: Categoria[] }) {
  const [open, setOpen] = useState(false);
  const [categorias, setCategorias] = useState(initial);
  const [novoNome, setNovoNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCriar() {
    if (!novoNome.trim()) { setErro("Nome obrigatório"); return; }
    setSaving(true); setErro("");
    const res = await fetch("/api/admin/categorias", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: novoNome.trim() }),
    });
    setSaving(false);
    if (!res.ok) { setErro("Erro ao criar"); return; }
    const data = await res.json();
    setCategorias((prev) => [...prev, { id: data.id, nome: novoNome.trim(), order: prev.length, createdAt: Date.now() }]);
    setNovoNome("");
  }

  async function handleSalvarEdit() {
    if (!editNome.trim() || !editId) return;
    await fetch(`/api/admin/categorias/${editId}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: editNome.trim() }),
    });
    setCategorias((prev) => prev.map((c) => c.id === editId ? { ...c, nome: editNome.trim() } : c));
    setEditId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta categoria? Produtos vinculados perderão a categoria.")) return;
    setDeletingId(id);
    await fetch(`/api/admin/categorias/${id}`, { method: "DELETE", credentials: "include" });
    setCategorias((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`self-start flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition ${open ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-dashed border-[#3d3d3d] text-gray-500 hover:border-[#b8944a] hover:text-[#b8944a]"}`}
      >
        <IconTag size={11} /> Gerenciar categorias
      </button>

      {open && (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-400 font-medium">Categorias de produtos</p>
          <div className="flex gap-2">
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCriar()}
              placeholder="Ex: Pomadas, Shampoos…"
              className={inp}
              style={{ fontSize: 16 }} spellCheck={false}
            />
            <button
              onClick={handleCriar}
              disabled={saving}
              className="px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50 shrink-0"
            >
              {saving ? <IconLoader2 size={14} className="animate-spin" /> : <IconPlus size={14} />}
            </button>
          </div>
          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          {categorias.length === 0 ? (
            <p className="text-gray-600 text-xs">Nenhuma categoria criada.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {categorias.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg">
                  {editId === cat.id ? (
                    <>
                      <input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSalvarEdit()}
                        className="flex-1 bg-transparent text-sm text-[#F5E6C8] focus:outline-none"
                        autoFocus
                      />
                      <button onClick={handleSalvarEdit} className="text-green-400 hover:text-green-300 transition"><IconCheck size={14} /></button>
                      <button onClick={() => setEditId(null)} className="text-gray-500 hover:text-white transition"><IconX size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-[#F5E6C8]">{cat.nome}</span>
                      <button onClick={() => { setEditId(cat.id); setEditNome(cat.nome); }} className="text-gray-500 hover:text-[#b8944a] transition"><IconEdit size={13} /></button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deletingId === cat.id}
                        className="text-gray-500 hover:text-red-400 transition disabled:opacity-50"
                      >
                        {deletingId === cat.id ? <IconLoader2 size={13} className="animate-spin" /> : <IconTrash size={13} />}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
