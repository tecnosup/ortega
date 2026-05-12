"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Edit2, Trash2, X, Check, Loader2 } from "lucide-react";
import type { Barbeiro } from "@/lib/barbeiros";

type Form = { nome: string; apelido: string; comissao: string; ativo: boolean };
const EMPTY: Form = { nome: "", apelido: "", comissao: "40", ativo: true };

export default function BarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Barbeiro | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/barbeiros");
    const json = await res.json();
    setBarbeiros(json.barbeiros ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(EMPTY);
    setError("");
    setModal({ open: true, editing: null });
  }

  function openEdit(b: Barbeiro) {
    setForm({ nome: b.nome, apelido: b.apelido ?? "", comissao: String(b.comissao), ativo: b.ativo });
    setError("");
    setModal({ open: true, editing: b });
  }

  function closeModal() {
    setModal({ open: false, editing: null });
  }

  async function handleSave() {
    if (!form.nome.trim()) { setError("Nome obrigatório"); return; }
    const comissao = Number(form.comissao);
    if (isNaN(comissao) || comissao < 0 || comissao > 100) { setError("Comissão deve ser entre 0 e 100"); return; }
    setSaving(true);
    setError("");
    try {
      const body = { nome: form.nome.trim(), apelido: form.apelido.trim() || undefined, comissao, ativo: form.ativo };
      if (modal.editing) {
        await fetch(`/api/admin/barbeiros/${modal.editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/admin/barbeiros", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      await load();
      closeModal();
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover ${nome}? Agendamentos existentes não serão afetados.`)) return;
    setDeletingId(id);
    await fetch(`/api/admin/barbeiros/${id}`, { method: "DELETE" });
    await load();
    setDeletingId(null);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Barbeiros</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          <Plus size={16} /> Novo barbeiro
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : barbeiros.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum barbeiro cadastrado.</p>
      ) : (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg divide-y divide-[#1a1a1a]">
          {barbeiros.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#151515] transition">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold text-[#F5E6C8] text-sm">{b.nome}{b.apelido ? <span className="text-gray-500 font-normal"> ({b.apelido})</span> : null}</p>
                <p className="text-xs text-gray-500">
                  Comissão <span className="text-[#b8944a] font-medium">{b.comissao}%</span>
                  {" · "}
                  <span className={b.ativo ? "text-green-400" : "text-gray-600"}>{b.ativo ? "Ativo" : "Inativo"}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(b)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition"
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(b.id, b.nome)}
                  disabled={deletingId === b.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-red-500 hover:text-red-400 transition disabled:opacity-50"
                >
                  {deletingId === b.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-md flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#F5E6C8]">{modal.editing ? "Editar barbeiro" : "Novo barbeiro"}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Nome completo *</span>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition"
                  placeholder="Ex: João Silva"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Apelido (opcional)</span>
                <input
                  value={form.apelido}
                  onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))}
                  className="bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition"
                  placeholder="Ex: João"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Comissão (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.comissao}
                  onChange={(e) => setForm((f) => ({ ...f, comissao: e.target.value }))}
                  className="bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition"
                  placeholder="40"
                />
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm((f) => ({ ...f, ativo: !f.ativo }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.ativo ? "bg-[#b8944a]" : "bg-[#2d2d2d]"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.ativo ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-sm text-gray-400">{form.ativo ? "Ativo" : "Inativo"}</span>
              </label>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {modal.editing ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
