"use client";

import { useState, useCallback } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconCheck, IconChevronDown, IconChevronUp, IconEdit, IconGripVertical,
  IconLoader2, IconPlus, IconTrash, IconX,
} from "@tabler/icons-react";
import { useConfirm } from "@/components/ui/Confirm";
import { useSucesso } from "@/components/ui/Sucesso";

// Produtos e serviços têm coleções separadas no Firestore, mas categoria tem a
// mesma forma nos dois — daí o tipo estrutural em vez de importar um dos dois.
export type CategoriaBase = { id: string; nome: string; order: number; createdAt: number };

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition w-full";

function LinhaCategoria({
  cat, index, total, editando, editNome, deletando,
  onEditNome, onIniciarEdit, onSalvarEdit, onCancelarEdit, onDelete, onMover,
}: {
  cat: CategoriaBase;
  index: number;
  total: number;
  editando: boolean;
  editNome: string;
  deletando: boolean;
  onEditNome: (v: string) => void;
  onIniciarEdit: () => void;
  onSalvarEdit: () => void;
  onCancelarEdit: () => void;
  onDelete: () => void;
  onMover: (dir: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg"
    >
      {/* reordenar: grip (arrasta) + setas (um passo) — mesmo padrão da lista de produtos */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 text-gray-700">
        <button
          onClick={() => onMover(-1)}
          disabled={index === 0 || editando}
          title="Subir"
          className="text-gray-600 hover:text-[#b8944a] disabled:opacity-20 disabled:hover:text-gray-600 transition"
        >
          <IconChevronUp size={12} />
        </button>
        <button
          {...attributes}
          {...listeners}
          className="hover:text-gray-400 transition cursor-grab active:cursor-grabbing touch-none"
          title="Arraste para reordenar"
        >
          <IconGripVertical size={13} />
        </button>
        <button
          onClick={() => onMover(1)}
          disabled={index === total - 1 || editando}
          title="Descer"
          className="text-gray-600 hover:text-[#b8944a] disabled:opacity-20 disabled:hover:text-gray-600 transition"
        >
          <IconChevronDown size={12} />
        </button>
      </div>

      {editando ? (
        <>
          <input
            value={editNome}
            onChange={(e) => onEditNome(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSalvarEdit(); if (e.key === "Escape") onCancelarEdit(); }}
            className="flex-1 min-w-0 bg-transparent text-sm text-[#F5E6C8] focus:outline-none"
            autoFocus spellCheck={false} style={{ fontSize: 16 }}
          />
          <button onClick={onSalvarEdit} className="text-green-400 hover:text-green-300 transition shrink-0"><IconCheck size={14} /></button>
          <button onClick={onCancelarEdit} className="text-gray-500 hover:text-white transition shrink-0"><IconX size={14} /></button>
        </>
      ) : (
        <>
          <span className="flex-1 min-w-0 text-sm text-[#F5E6C8] truncate">{cat.nome}</span>
          <button onClick={onIniciarEdit} className="text-gray-500 hover:text-[#b8944a] transition shrink-0"><IconEdit size={13} /></button>
          <button onClick={onDelete} disabled={deletando} className="text-gray-500 hover:text-red-400 transition disabled:opacity-50 shrink-0">
            {deletando ? <IconLoader2 size={13} className="animate-spin" /> : <IconTrash size={13} />}
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Painel de categorias: criar, renomear, remover e ORDENAR.
 *
 * A ordem aqui é a ordem das abas na landing — getCategorias() já faz
 * orderBy("order") e a landing preserva a ordem do array que recebe.
 *
 * Controlado: a lista vem do pai e volta por onChange, porque o pai também usa
 * as categorias em outro lugar (o select de categoria do produto/serviço) e
 * precisa vê-las atualizadas sem recarregar a página.
 */
export default function CategoriasPainel({
  titulo, placeholder, endpoint, categorias, onChange, onReorder,
}: {
  titulo: string;
  placeholder: string;
  /** Base REST: POST em `endpoint`, PATCH/DELETE em `endpoint/{id}`. */
  endpoint: string;
  categorias: CategoriaBase[];
  onChange: (cats: CategoriaBase[]) => void;
  onReorder: (ids: string[]) => Promise<{ ok: boolean; error?: string }>;
}) {
  const confirmar = useConfirm();
  const sucesso = useSucesso();
  const [novoNome, setNovoNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Aplica a nova ordem otimista e persiste. Se o servidor recusar, desfaz.
  const aplicarOrdem = useCallback(async (nova: CategoriaBase[]) => {
    const anterior = categorias;
    onChange(nova.map((c, i) => ({ ...c, order: i })));
    const res = await onReorder(nova.map((c) => c.id));
    if (!res.ok) {
      onChange(anterior);
      setErro(res.error ?? "Erro ao reordenar");
    }
  }, [categorias, onChange, onReorder]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const de = categorias.findIndex((c) => c.id === active.id);
    const para = categorias.findIndex((c) => c.id === over.id);
    if (de < 0 || para < 0) return;
    aplicarOrdem(arrayMove(categorias, de, para));
  }

  function mover(index: number, dir: -1 | 1) {
    const destino = index + dir;
    if (destino < 0 || destino >= categorias.length) return;
    aplicarOrdem(arrayMove(categorias, index, destino));
  }

  async function handleCriar() {
    if (!novoNome.trim()) { setErro("Nome obrigatório"); return; }
    setSaving(true); setErro("");
    const res = await fetch(endpoint, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novoNome.trim() }),
    });
    setSaving(false);
    if (!res.ok) { setErro("Erro ao criar"); return; }
    const data = await res.json();
    onChange([...categorias, { id: data.id, nome: novoNome.trim(), order: categorias.length, createdAt: Date.now() }]);
    setNovoNome("");
    sucesso("Categoria criada!");
  }

  async function handleSalvarEdit() {
    if (!editNome.trim() || !editId) return;
    const id = editId;
    const nome = editNome.trim();
    setEditId(null);
    await fetch(`${endpoint}/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    onChange(categorias.map((c) => (c.id === id ? { ...c, nome } : c)));
    sucesso("Categoria atualizada!");
  }

  async function handleDelete(id: string) {
    if (!(await confirmar({
      titulo: "Remover categoria",
      mensagem: "Remover esta categoria? Os itens vinculados perderão a categoria.",
      confirmar: "Remover",
    }))) return;
    setDeletingId(id);
    await fetch(`${endpoint}/${id}`, { method: "DELETE", credentials: "include" });
    onChange(categorias.filter((c) => c.id !== id));
    setDeletingId(null);
    sucesso("Categoria removida!");
  }

  return (
    <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-gray-400 font-medium">{titulo}</p>
        <p className="text-[10px] text-gray-600">Arraste para definir a ordem das abas na landing.</p>
      </div>

      <div className="flex gap-2">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCriar()}
          placeholder={placeholder}
          className={inp}
          style={{ fontSize: 16 }} spellCheck={false}
        />
        <button
          onClick={handleCriar}
          disabled={saving}
          className="px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50 shrink-0"
          title="Adicionar categoria"
        >
          {saving ? <IconLoader2 size={14} className="animate-spin" /> : <IconPlus size={14} />}
        </button>
      </div>
      {erro && <p className="text-red-400 text-xs">{erro}</p>}

      {categorias.length === 0 ? (
        <p className="text-gray-600 text-xs">Nenhuma categoria criada.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categorias.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1">
              {categorias.map((cat, i) => (
                <LinhaCategoria
                  key={cat.id}
                  cat={cat}
                  index={i}
                  total={categorias.length}
                  editando={editId === cat.id}
                  editNome={editNome}
                  deletando={deletingId === cat.id}
                  onEditNome={setEditNome}
                  onIniciarEdit={() => { setEditId(cat.id); setEditNome(cat.nome); }}
                  onSalvarEdit={handleSalvarEdit}
                  onCancelarEdit={() => setEditId(null)}
                  onDelete={() => handleDelete(cat.id)}
                  onMover={(dir) => mover(i, dir)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
