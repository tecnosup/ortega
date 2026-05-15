"use client";

import { useEffect, useRef, useState } from "react";
import {
  Scissors, Plus, Edit2, Trash2, X, Check, Loader2,
  Tag, ChevronDown, ChevronUp, Filter,
} from "lucide-react";
import type { Item } from "@/lib/admin-items";
import type { CategoriaServico } from "@/lib/admin-categorias-servicos";

type Form = {
  titulo: string;
  descricao: string;
  preco: string;
  duracao: string;
  categoriaId: string;
  status: "draft" | "published";
  order: string;
  imagem: string;
};

const EMPTY: Form = {
  titulo: "", descricao: "", preco: "", duracao: "",
  categoriaId: "", status: "published", order: "0", imagem: "",
};

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition w-full";

export default function ServicosPage() {
  const [itens, setItens] = useState<Item[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Item | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "published" | "draft">("todos");
  const [catOpen, setCatOpen] = useState(false);
  const [novaCat, setNovaCat] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [catErro, setCatErro] = useState("");
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catEditNome, setCatEditNome] = useState("");
  const [catDeletingId, setCatDeletingId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const [resItens, resCat] = await Promise.all([
      fetch("/api/admin/itens", { credentials: "include" }),
      fetch("/api/admin/categorias-servicos", { credentials: "include" }),
    ]);
    if (resItens.ok) {
      const d = await resItens.json();
      setItens(d.items ?? []);
    }
    if (resCat.ok) {
      const d = await resCat.json();
      setCategorias(d.categorias ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ ...EMPTY, order: String(itens.length) });
    setError("");
    setUploadError("");
    setModal({ open: true, editing: null });
  }

  function openEdit(item: Item) {
    setForm({
      titulo: item.titulo,
      descricao: item.descricao ?? "",
      preco: item.preco ?? "",
      duracao: item.duracao ?? "",
      categoriaId: item.categoriaId ?? "",
      status: item.status,
      order: String(item.order),
      imagem: item.imagem ?? "",
    });
    setError("");
    setUploadError("");
    setModal({ open: true, editing: item });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "ortega/itens");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.url) setForm((f) => ({ ...f, imagem: data.url }));
      else setUploadError(data.error ?? "Erro no upload");
    } catch {
      setUploadError("Erro de rede");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.titulo.trim()) { setError("Título obrigatório"); return; }
    setSaving(true);
    setError("");
    const body = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      preco: form.preco.trim(),
      duracao: form.duracao.trim(),
      categoriaId: form.categoriaId || undefined,
      status: form.status,
      order: Number(form.order) || 0,
      imagem: form.imagem || undefined,
    };
    try {
      if (modal.editing) {
        await fetch(`/api/admin/itens/${modal.editing.id}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/admin/itens", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      await load();
      setModal({ open: false, editing: null });
    } catch {
      setError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, titulo: string) {
    if (!confirm(`Remover "${titulo}"?`)) return;
    setDeletingId(id);
    await fetch(`/api/admin/itens/${id}`, { method: "DELETE", credentials: "include" });
    await load();
    setDeletingId(null);
  }

  async function handleCriarCat() {
    if (!novaCat.trim()) { setCatErro("Nome obrigatório"); return; }
    setCatSaving(true); setCatErro("");
    const res = await fetch("/api/admin/categorias-servicos", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: novaCat.trim() }),
    });
    setCatSaving(false);
    if (!res.ok) { setCatErro("Erro ao criar"); return; }
    setNovaCat("");
    await load();
  }

  async function handleSalvarCatEdit() {
    if (!catEditNome.trim() || !catEditId) return;
    await fetch(`/api/admin/categorias-servicos/${catEditId}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: catEditNome.trim() }),
    });
    setCatEditId(null);
    await load();
  }

  async function handleDeleteCat(id: string) {
    if (!confirm("Remover esta categoria?")) return;
    setCatDeletingId(id);
    await fetch(`/api/admin/categorias-servicos/${id}`, { method: "DELETE", credentials: "include" });
    setCatDeletingId(null);
    await load();
  }

  const catNomeById = (id?: string) => categorias.find((c) => c.id === id)?.nome;

  const itensFiltrados = itens
    .filter((i) => filtroCategoria === "todas" || i.categoriaId === filtroCategoria)
    .filter((i) => filtroStatus === "todos" || i.status === filtroStatus);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Scissors size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Serviços</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          <Plus size={15} /> Novo serviço
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 text-gray-500 text-xs"><Filter size={12} /></div>
          <button
            onClick={() => setFiltroCategoria("todas")}
            className={`px-3 py-1 text-xs rounded-full border transition ${filtroCategoria === "todas" ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-[#2d2d2d] text-gray-500 hover:border-[#444]"}`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(cat.id)}
              className={`px-3 py-1 text-xs rounded-full border transition ${filtroCategoria === cat.id ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-[#2d2d2d] text-gray-500 hover:border-[#444]"}`}
            >
              {cat.nome}
            </button>
          ))}
          <button
            onClick={() => setCatOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition ${catOpen ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-dashed border-[#3d3d3d] text-gray-500 hover:border-[#b8944a] hover:text-[#b8944a]"}`}
          >
            <Tag size={11} /> Gerenciar categorias
          </button>
          <div className="w-px h-4 bg-[#2d2d2d]" />
          {(["todos", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1 text-xs rounded-full border transition ${filtroStatus === s ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-[#2d2d2d] text-gray-500 hover:border-[#444]"}`}
            >
              {s === "todos" ? "Todos" : s === "published" ? "Publicados" : "Rascunhos"}
            </button>
          ))}
        </div>

        {catOpen && (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium">Categorias de serviços</p>
            <div className="flex gap-2">
              <input
                value={novaCat}
                onChange={(e) => setNovaCat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCriarCat()}
                placeholder="Ex: Cortes, Tratamentos…"
                className={inp}
                style={{ fontSize: 16 }}
              />
              <button
                onClick={handleCriarCat}
                disabled={catSaving}
                className="px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50 shrink-0"
              >
                {catSaving ? <Loader2 size={14} className="animate-spin" /> : "Adicionar"}
              </button>
            </div>
            {catErro && <p className="text-red-400 text-xs">{catErro}</p>}
            {categorias.length === 0 ? (
              <p className="text-gray-600 text-xs">Nenhuma categoria criada.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {categorias.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg">
                    {catEditId === cat.id ? (
                      <>
                        <input
                          value={catEditNome}
                          onChange={(e) => setCatEditNome(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSalvarCatEdit()}
                          className="flex-1 bg-transparent text-sm text-[#F5E6C8] focus:outline-none"
                          autoFocus
                        />
                        <button onClick={handleSalvarCatEdit} className="text-green-400 hover:text-green-300 transition"><Check size={14} /></button>
                        <button onClick={() => setCatEditId(null)} className="text-gray-500 hover:text-white transition"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-[#F5E6C8]">{cat.nome}</span>
                        <button onClick={() => { setCatEditId(cat.id); setCatEditNome(cat.nome); }} className="text-gray-500 hover:text-[#b8944a] transition"><Edit2 size={13} /></button>
                        <button
                          onClick={() => handleDeleteCat(cat.id)}
                          disabled={catDeletingId === cat.id}
                          className="text-gray-500 hover:text-red-400 transition disabled:opacity-50"
                        >
                          {catDeletingId === cat.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : itensFiltrados.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum serviço encontrado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {itensFiltrados.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <div key={item.id} className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  {item.imagem && (
                    <img src={item.imagem} alt={item.titulo} className="w-10 h-10 object-cover rounded-lg border border-[#2d2d2d] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-semibold text-[#F5E6C8] text-sm truncate">{item.titulo}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${item.status === "published" ? "border-green-800 text-green-400 bg-green-950/40" : "border-[#2d2d2d] text-gray-600"}`}>
                        {item.status === "published" ? "Publicado" : "Rascunho"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-2 mt-0.5">
                      {catNomeById(item.categoriaId) && <span className="text-xs text-[#b8944a]">{catNomeById(item.categoriaId)}</span>}
                      {item.preco && <span className="text-xs text-gray-500">R$ {item.preco}</span>}
                      {item.duracao && <span className="text-xs text-gray-500">{item.duracao}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    className="p-1.5 rounded-lg border border-[#2d2d2d] text-gray-500 hover:text-white hover:border-[#444] transition shrink-0"
                  >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {expanded && (
                  <div className="border-t border-[#1a1a1a] px-4 py-3 flex flex-col gap-3">
                    {item.descricao && <p className="text-xs text-gray-400">{item.descricao}</p>}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => { setExpandedId(null); openEdit(item); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.titulo)}
                        disabled={deletingId === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-red-500 hover:text-red-400 transition disabled:opacity-50"
                      >
                        {deletingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-[#111] border border-[#2d2d2d] rounded-t-2xl sm:rounded-xl w-full max-w-lg flex flex-col max-h-[92dvh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d] shrink-0">
              <h2 className="font-bold text-[#F5E6C8]">{modal.editing ? "Editar serviço" : "Novo serviço"}</h2>
              <button onClick={() => setModal({ open: false, editing: null })} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Imagem</span>
                {form.imagem && (
                  <div className="relative w-32 h-20 mb-1">
                    <img src={form.imagem} alt="preview" className="w-32 h-20 object-cover rounded-lg border border-[#2d2d2d]" />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, imagem: "" }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#111] border border-[#2d2d2d] rounded-full text-gray-400 hover:text-red-400 flex items-center justify-center text-xs transition">✕</button>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-gray-400 hover:file:bg-[#252525]" />
                {uploading && <span className="text-xs text-gray-500">Enviando...</span>}
                {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Título *</span>
                <input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} className={inp} placeholder="Ex: Corte degradê" style={{ fontSize: 16 }} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Descrição</span>
                <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className={`${inp} resize-none`} placeholder="Descrição do serviço..." style={{ fontSize: 16 }} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Preço</span>
                  <input value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} className={inp} placeholder="ex: 55,00" style={{ fontSize: 16 }} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Duração</span>
                  <input value={form.duracao} onChange={(e) => setForm((f) => ({ ...f, duracao: e.target.value }))} className={inp} placeholder="ex: 45 min" style={{ fontSize: 16 }} />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Categoria</span>
                <select value={form.categoriaId} onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))} className={inp} style={{ fontSize: 16 }}>
                  <option value="">Sem categoria</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Status</span>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))} className={inp} style={{ fontSize: 16 }}>
                    <option value="published">Publicado</option>
                    <option value="draft">Rascunho</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Ordem</span>
                  <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} className={inp} style={{ fontSize: 16 }} />
                </label>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#2d2d2d] shrink-0">
              <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
              <button
                onClick={handleSave} disabled={saving}
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
