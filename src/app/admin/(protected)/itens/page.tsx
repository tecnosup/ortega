"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconCheck, IconChevronDown, IconChevronUp, IconEdit, IconGripVertical, IconLoader2, IconPlus, IconScissors, IconTag, IconTrash,
} from "@tabler/icons-react";
import InputImagem from "@/components/ui/InputImagem";
import CategoriasPainel from "@/components/admin/CategoriasPainel";
import Revelar from "@/components/ui/Revelar";
import Select from "@/components/ui/Select";
import type { Item } from "@/lib/admin-items";
import { resolverDuracaoMin } from "@/lib/agendamentos-types";
import type { CategoriaServico } from "@/lib/admin-categorias-servicos";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Modal from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/Confirm";
import { useSucesso } from "@/components/ui/Sucesso";
import { reorderItensAction, reorderCategoriasServicosAction } from "./actions";

type Form = {
  titulo: string;
  descricao: string;
  preco: string;
  duracaoMin: string;   // minutos (input numérico)
  categoriaId: string;
  status: "draft" | "published";
  imagem: string;
};

const EMPTY: Form = {
  titulo: "", descricao: "", preco: "", duracaoMin: "",
  categoriaId: "", status: "published", imagem: "",
};

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition w-full";

function SortableItemRow({ item, expanded, deletingId, onToggleExpand, onEdit, onDelete }: {
  item: Item; expanded: boolean;
  deletingId: string | null; onToggleExpand: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="bg-[#111] border-b border-[#1a1a1a] last:border-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button {...attributes} {...listeners} className="text-gray-700 hover:text-gray-400 transition cursor-grab active:cursor-grabbing shrink-0 touch-none">
          <IconGripVertical size={16} />
        </button>
        {item.imagem && (
          <img src={item.imagem} alt={item.titulo} className="w-10 h-10 object-cover rounded-lg border border-[#2d2d2d] shrink-0" loading="lazy" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold text-[#F5E6C8] text-sm truncate">{item.titulo}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${item.status === "published" ? "border-green-800 text-green-400 bg-green-950/40" : "border-[#2d2d2d] text-gray-600"}`}>
              {item.status === "published" ? "Publicado" : "Rascunho"}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-2 mt-0.5">
            {item.preco && <span className="text-xs text-gray-500">R$ {item.preco}</span>}
            {(item.duracaoMin || item.duracao) && (
              <span className="text-xs text-gray-500">{resolverDuracaoMin(item)} min</span>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg border border-[#2d2d2d] text-gray-500 hover:text-[#b8944a] hover:border-[#b8944a] transition shrink-0"
          title="Editar"
        >
          <IconEdit size={14} />
        </button>
        <button
          onClick={onDelete}
          disabled={deletingId === item.id}
          className="p-1.5 rounded-lg border border-[#2d2d2d] text-gray-500 hover:text-red-400 hover:border-red-500 transition shrink-0 disabled:opacity-50"
          title="Remover"
        >
          {deletingId === item.id ? <IconLoader2 size={14} className="animate-spin" /> : <IconTrash size={14} />}
        </button>
        <button onClick={onToggleExpand} className="p-1.5 rounded-lg border border-[#2d2d2d] text-gray-500 hover:text-white hover:border-[#444] transition shrink-0">
          {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#1a1a1a] px-4 py-3 flex flex-col gap-2">
          {item.descricao
            ? <p className="text-xs text-gray-400">{item.descricao}</p>
            : <p className="text-xs text-gray-600 italic">Sem descrição.</p>}
        </div>
      )}
    </div>
  );
}

export default function ServicosPage() {
  const confirmar = useConfirm();
  const sucesso = useSucesso();
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
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "published" | "draft">("todos");
  // criar/renomear/remover/ordenar categoria vive no CategoriasPainel
  const [catOpen, setCatOpen] = useState(false);
  const [reorderSaving, setReorderSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEndForGroup = useCallback(async (event: DragEndEvent, groupIds: string[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groupIds.indexOf(active.id as string);
    const newIndex = groupIds.indexOf(over.id as string);
    const reorderedGroupIds = arrayMove(groupIds, oldIndex, newIndex);
    const groupSet = new Set(groupIds);
    const groupReordered = reorderedGroupIds.map((id) => itens.find((i) => i.id === id)!);
    const final = [...itens];
    let gi = 0;
    for (let i = 0; i < final.length && gi < groupReordered.length; i++) {
      if (groupSet.has(final[i].id)) final[i] = groupReordered[gi++];
    }
    setItens(final);
    setReorderSaving(true);
    await reorderItensAction(final.map((i) => i.id));
    setReorderSaving(false);
  }, [itens]);

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
    setForm({ ...EMPTY });
    setError("");
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
    setModal({ open: true, editing: null });
  }

  function openEdit(item: Item) {
    setForm({
      titulo: item.titulo,
      descricao: item.descricao ?? "",
      preco: item.preco ?? "",
      // número novo; se legado só tem texto ("45 min"), converte na abertura
      duracaoMin: item.duracaoMin
        ? String(item.duracaoMin)
        : item.duracao
        ? String(resolverDuracaoMin(item))
        : "",
      categoriaId: item.categoriaId ?? "",
      status: item.status,
      imagem: item.imagem ?? "",
    });
    setError("");
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
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
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, imagem: data.url }));
        if (fileRef.current) fileRef.current.value = "";
      } else {
        setUploadError(data.error ?? "Erro no upload");
      }
    } catch {
      setUploadError("Erro de rede");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.titulo.trim()) { setError("Título obrigatório"); return; }
    // DURAÇÃO OBRIGATÓRIA: serviço sem duração era a causa de agendamentos
    // sobrepostos (combo virava 5min pelo fallback do passo). Exige > 0.
    const dur = parseInt(form.duracaoMin.trim(), 10);
    if (!dur || dur <= 0) { setError("Informe a duração do serviço (em minutos). É obrigatória para a agenda funcionar."); return; }
    setSaving(true);
    setError("");
    const body = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      preco: form.preco.trim(),
      // grava minutos; mantém `duracao` texto em sincronia p/ landing/legado
      duracaoMin: form.duracaoMin.trim(),
      duracao: form.duracaoMin.trim() ? `${form.duracaoMin.trim()} min` : "",
      categoriaId: form.categoriaId || undefined,
      status: form.status,
      order: modal.editing ? undefined : itens.length,
      imagem: form.imagem || undefined,
    };
    try {
      const editando = !!modal.editing;
      const res = editando
        ? await fetch(`/api/admin/itens/${modal.editing!.id}`, {
            method: "PATCH", credentials: "include",
            headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          })
        : await fetch("/api/admin/itens", {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.error ?? "Erro ao salvar.");
        setSaving(false);
        return;
      }
      await load();
      setModal({ open: false, editing: null });
      sucesso(editando ? "Serviço atualizado!" : "Serviço criado!");
    } catch {
      setError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, titulo: string) {
    if (!(await confirmar({ titulo: "Remover serviço", mensagem: `Remover "${titulo}"? Esta ação é irreversível.`, confirmar: "Remover" }))) return;
    setDeletingId(id);
    await fetch(`/api/admin/itens/${id}`, { method: "DELETE", credentials: "include" });
    await load();
    setDeletingId(null);
    sucesso("Serviço removido!");
  }

  const catNomeById = (id?: string) => categorias.find((c) => c.id === id)?.nome;

  const itensFiltrados = itens
    .filter((i) => filtroStatus === "todos" || i.status === filtroStatus);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconScissors size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Serviços</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          <IconPlus size={15} /> Novo serviço
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setCatOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition ${catOpen ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-dashed border-[#3d3d3d] text-gray-500 hover:border-[#b8944a] hover:text-[#b8944a]"}`}
          >
            <IconTag size={11} /> Gerenciar categorias
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

        <Revelar show={catOpen}>
          <CategoriasPainel
            titulo="Categorias de serviços"
            placeholder="Ex: Cortes, Tratamentos…"
            endpoint="/api/admin/categorias-servicos"
            categorias={categorias}
            onChange={(cats) => setCategorias(cats as CategoriaServico[])}
            onReorder={reorderCategoriasServicosAction}
          />
        </Revelar>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm"><IconLoader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : itensFiltrados.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum serviço encontrado.</p>
      ) : (() => {
          // Agrupa por categoria; dentro do grupo, mantém a ordem global
          const grupos: { categoriaId: string | null; nome: string; itens: Item[] }[] = [];
          const visto = new Set<string | null>();
          for (const item of itensFiltrados) {
            const cid = item.categoriaId ?? null;
            if (!visto.has(cid)) {
              visto.add(cid);
              grupos.push({ categoriaId: cid, nome: cid ? (catNomeById(cid) ?? "Sem categoria") : "Sem categoria", itens: [] });
            }
            grupos.find((g) => g.categoriaId === cid)!.itens.push(item);
          }
          // Ordem dos grupos = ordem das CATEGORIAS (a mesma das abas na landing).
          // "Sem categoria" por último.
          const posCategoria = new Map(categorias.map((c, i) => [c.id, i]));
          grupos.sort((a, b) => {
            if (a.categoriaId === null) return 1;
            if (b.categoriaId === null) return -1;
            return (posCategoria.get(a.categoriaId) ?? Infinity) - (posCategoria.get(b.categoriaId) ?? Infinity);
          });
          return (
            <>
              {reorderSaving && <p className="text-xs text-gray-500 text-right -mb-1">Salvando ordem...</p>}
              <div className="flex flex-col gap-4">
                {grupos.map((grupo) => {
                  const groupIds = grupo.itens.map((i) => i.id);
                  return (
                    <div key={grupo.categoriaId ?? "__sem__"} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-[#b8944a]">{grupo.nome}</span>
                        <span className="text-[10px] text-gray-600">{grupo.itens.length} serviço{grupo.itens.length !== 1 ? "s" : ""}</span>
                      </div>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEndForGroup(e, groupIds)}>
                        <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
                          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden">
                            {grupo.itens.map((item) => {
                              const expanded = expandedId === item.id;
                              return (
                                <SortableItemRow
                                  key={item.id}
                                  item={item}
                                  expanded={expanded}
                                  deletingId={deletingId}
                                  onToggleExpand={() => setExpandedId(expanded ? null : item.id)}
                                  onEdit={() => { setExpandedId(null); openEdit(item); }}
                                  onDelete={() => handleDelete(item.id, item.titulo)}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()
      }

      <Modal open={modal.open} onClose={() => setModal({ open: false, editing: null })}
        overlayClassName="backdrop-blur-sm" className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-lg flex flex-col sm:mx-4">
            <div className="flex items-center px-6 py-4 border-b border-[#2d2d2d] shrink-0">
              <h2 className="font-bold text-[#F5E6C8]">{modal.editing ? "Editar serviço" : "Novo serviço"}</h2>
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
                <InputImagem inputRef={fileRef} onChange={handleUpload} uploading={uploading} temImagem={!!form.imagem} />
                {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Título *</span>
                <input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} className={inp} placeholder="Ex: Corte degradê" style={{ fontSize: 16 }} spellCheck={false} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Descrição</span>
                <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className={`${inp} resize-none`} placeholder="Descrição do serviço..." style={{ fontSize: 16 }} spellCheck={false} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Preço</span>
                  <input value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} className={inp} placeholder="ex: 55,00" style={{ fontSize: 16 }} spellCheck={false} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Duração (min) *</span>
                  <input
                    value={form.duracaoMin}
                    onChange={(e) => setForm((f) => ({ ...f, duracaoMin: e.target.value.replace(/\D/g, "") }))}
                    inputMode="numeric"
                    className={inp}
                    placeholder="ex: 45"
                    style={{ fontSize: 16 }}
                    spellCheck={false}
                  />
                  <span className="text-[10px] text-gray-600">Obrigatória — reserva o intervalo certo na agenda e evita horários sobrepostos.</span>
                </label>
              </div>

              {/* div, não label: o Select do sistema é um <button>, e label só faz
                  sentido envolvendo controle de formulário nativo. */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Categoria</span>
                <Select
                  value={form.categoriaId}
                  onChange={(v) => setForm((f) => ({ ...f, categoriaId: v }))}
                  options={[{ value: "", label: "Sem categoria" }, ...categorias.map((c) => ({ value: c.id, label: c.nome }))]}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Status</span>
                <Select
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v as "draft" | "published" }))}
                  options={[{ value: "published", label: "Publicado" }, { value: "draft", label: "Rascunho" }]}
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#2d2d2d] shrink-0">
              <button onClick={() => setModal({ open: false, editing: null })} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
              <button
                onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50"
              >
                {saving ? <IconLoader2 size={14} className="animate-spin" /> : <IconCheck size={14} />}
                {modal.editing ? "Salvar" : "Criar"}
              </button>
            </div>
      </Modal>
    </div>
  );
}
