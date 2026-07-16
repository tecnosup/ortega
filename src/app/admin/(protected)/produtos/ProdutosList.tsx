"use client";

import { useState, useCallback } from "react";
import {
  IconEdit, IconGripVertical, IconShoppingBag, IconTrash,
  IconChevronUp, IconChevronDown, IconMinus, IconPlus, IconAlertTriangle,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { useSucesso } from "@/components/ui/Sucesso";
import { useModalMount } from "@/components/ui/useModalMount";
import ProdutoModal from "./ProdutoModal";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteProdutoAction, toggleStatusAction, reorderProdutosAction } from "./actions";
import type { Produto } from "@/lib/admin-produtos";
import type { Categoria } from "@/lib/admin-categorias";

// ── nível de estoque → cor/rótulo (mesma semântica das movimentações) ──────────
function nivelEstoque(p: Produto): { key: "ok" | "warn" | "crit"; label: string; cls: string } {
  const est = p.estoque ?? 0;
  const min = p.estoqueMinimo ?? 5;
  if (est <= 0) return { key: "crit", label: "Esgotado", cls: "text-red-400 bg-red-950/60 border-red-900/60" };
  if (est <= min) return { key: "warn", label: `Baixo · mín ${min}`, cls: "text-amber-400 bg-amber-950/40 border-amber-900/50" };
  return { key: "ok", label: "Em estoque", cls: "text-green-400 bg-green-950/40 border-green-900/50" };
}

// ── stepper de estoque inline (−/+) — cada clique registra movimentação atômica ──
function EstoqueStepper({ produto, onEstoque }: { produto: Produto; onEstoque: (id: string, novo: number) => void }) {
  const toast = useToast();
  const [salvando, setSalvando] = useState<"-" | "+" | null>(null);
  const estoque = produto.estoque ?? 0;

  async function ajustar(delta: 1 | -1) {
    if (salvando) return;
    setSalvando(delta > 0 ? "+" : "-");
    try {
      const res = await fetch("/api/admin/estoque-movimentacoes/ajuste", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: produto.id,
          produtoNome: produto.titulo,
          produtoImagem: produto.imagem || undefined,
          // + no card = reposição (entrada) · − = venda (saída, entra no financeiro)
          tipo: delta > 0 ? "reposicao" : "venda",
          quantidade: delta,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { toast.erro(data?.error ?? "Não foi possível ajustar o estoque."); return; }
      onEstoque(produto.id, data.estoque);
    } catch {
      toast.erro("Erro de rede ao ajustar o estoque.");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="flex items-center border border-[#2d2d2d] rounded-lg overflow-hidden shrink-0 bg-[#0d0d0d]">
      <button
        onClick={() => ajustar(-1)}
        disabled={estoque <= 0 || salvando !== null}
        title="Dar baixa (venda) de 1"
        className="w-8 h-8 grid place-items-center text-gray-300 hover:bg-[#1c1a15] hover:text-[#b8944a] transition disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <IconMinus size={15} />
      </button>
      <span className="min-w-[40px] text-center text-sm font-bold tabular-nums text-[#F5E6C8] border-x border-[#2d2d2d] h-8 grid place-items-center px-1">
        {salvando ? "…" : estoque}
      </span>
      <button
        onClick={() => ajustar(1)}
        disabled={salvando !== null}
        title="Repor 1"
        className="w-8 h-8 grid place-items-center text-gray-300 hover:bg-[#1c1a15] hover:text-[#b8944a] transition disabled:opacity-40"
      >
        <IconPlus size={15} />
      </button>
    </div>
  );
}

function StatusToggle({ produto }: { produto: Produto }) {
  const [status, setStatus] = useState(produto.status);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const fd = new FormData();
    fd.append("id", produto.id);
    fd.append("status", status);
    const result = await toggleStatusAction(fd);
    if (result.ok) setStatus((s) => (s === "published" ? "draft" : "published"));
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={status === "published" ? "Clique para tornar rascunho" : "Clique para publicar"}
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition disabled:opacity-40 ${
        status === "published"
          ? "border-green-800 text-green-400 bg-green-950 hover:bg-green-900"
          : "border-[#2d2d2d] text-gray-500 bg-transparent hover:border-gray-500 hover:text-gray-400"
      }`}
    >
      {status === "published" ? "Publicado" : "Rascunho"}
    </button>
  );
}

// ── linha/card do produto ──────────────────────────────────────────────────────
function SortableRow({
  produto, index, total, onDelete, onEstoque, onMover, onEdit,
}: {
  produto: Produto; index: number; total: number;
  onDelete: (p: Produto) => void;
  onEstoque: (id: string, novo: number) => void;
  onMover: (id: string, dir: -1 | 1) => void;
  onEdit: (p: Produto) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: produto.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const nivel = nivelEstoque(produto);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-3 hover:bg-[#151515] transition border-b border-[#1a1a1a] last:border-0"
    >
      {/* reordenar: grip (arrasta) + setas (um passo) */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 text-gray-700">
        <button
          onClick={() => onMover(produto.id, -1)}
          disabled={index === 0}
          title="Subir"
          className="text-gray-600 hover:text-[#b8944a] disabled:opacity-20 disabled:hover:text-gray-600 transition"
        >
          <IconChevronUp size={14} />
        </button>
        <button {...attributes} {...listeners} className="hover:text-gray-400 transition cursor-grab active:cursor-grabbing touch-none" title="Arraste para reordenar">
          <IconGripVertical size={15} />
        </button>
        <button
          onClick={() => onMover(produto.id, 1)}
          disabled={index === total - 1}
          title="Descer"
          className="text-gray-600 hover:text-[#b8944a] disabled:opacity-20 disabled:hover:text-gray-600 transition"
        >
          <IconChevronDown size={14} />
        </button>
      </div>

      {/* imagem */}
      <div className="w-12 h-12 shrink-0 rounded border border-[#2d2d2d] overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.titulo} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <IconShoppingBag size={18} className="text-[#2d2d2d]" />
        )}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-[#F5E6C8] text-sm sm:truncate line-clamp-2 sm:line-clamp-1">{produto.titulo}</p>
          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${nivel.cls}`}>
            {nivel.key !== "ok" && <IconAlertTriangle size={9} />}{nivel.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {produto.preco && <span className="text-xs text-[#b8944a] font-semibold">R$ {produto.preco}</span>}
        </div>
        {/* ações no mobile ficam abaixo */}
        <div className="flex items-center gap-1.5 mt-2 sm:hidden">
          <StatusToggle produto={produto} />
          <button onClick={() => onEdit(produto)} className="flex items-center gap-1 px-2 py-1 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition">
            <IconEdit size={11} /> Editar
          </button>
          <button onClick={() => onDelete(produto)} className="flex items-center px-2 py-1 border border-[#2d2d2d] text-gray-500 text-xs rounded hover:border-red-700 hover:text-red-400 transition">
            <IconTrash size={11} />
          </button>
        </div>
      </div>

      {/* estoque inline (sempre visível) */}
      <div className="shrink-0">
        <EstoqueStepper produto={produto} onEstoque={onEstoque} />
      </div>

      {/* ações no desktop */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <StatusToggle produto={produto} />
        <button onClick={() => onEdit(produto)} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition" title="Editar">
          <IconEdit size={12} />
        </button>
        <button onClick={() => onDelete(produto)} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#2d2d2d] text-gray-500 text-xs rounded hover:border-red-700 hover:text-red-400 transition" title="Excluir">
          <IconTrash size={12} />
        </button>
      </div>
    </div>
  );
}

export default function ProdutosList({ produtos: initial, categorias }: { produtos: Produto[]; categorias: Categoria[] }) {
  const [produtos, setProdutos] = useState(initial);
  const [saving, setSaving] = useState(false);
  const confirmar = useConfirm();
  const toast = useToast();
  const sucesso = useSucesso(); // feedback positivo = popup verde padrão (igual ao Caixa)

  // modal de criar/editar produto (null = fechado; {} = novo; {produto} = editar)
  const [modalAlvo, setModalAlvo] = useState<{ produto: Produto | null } | null>(null);
  const modalMount = useModalMount(modalAlvo);

  const categoriaMap = new Map(categorias.map((c) => [c.id, c.nome]));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── resumo (topo) ──
  const totalPublicados = produtos.filter((p) => p.status === "published").length;
  const estoqueBaixo = produtos.filter((p) => nivelEstoque(p).key !== "ok").length;
  const unidades = produtos.reduce((s, p) => s + (p.estoque ?? 0), 0);

  // atualiza o estoque local após o stepper (sem refetch)
  const onEstoque = useCallback((id: string, novo: number) => {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, estoque: novo } : p)));
  }, []);

  // persiste a ordem no servidor
  const salvarOrdem = useCallback(async (lista: Produto[]) => {
    setSaving(true);
    await reorderProdutosAction(lista.map((p) => p.id));
    setSaving(false);
  }, []);

  // mover um passo (setas) — reordena DENTRO do grupo/categoria do item
  const onMover = useCallback((id: string, dir: -1 | 1) => {
    setProdutos((prev) => {
      const alvo = prev.find((p) => p.id === id);
      if (!alvo) return prev;
      const grupoKey = alvo.categoriaId ?? null;
      const idsGrupo = prev.filter((p) => (p.categoriaId ?? null) === grupoKey).map((p) => p.id);
      const gi = idsGrupo.indexOf(id);
      const ni = gi + dir;
      if (ni < 0 || ni >= idsGrupo.length) return prev;
      const novaOrdemGrupo = arrayMove(idsGrupo, gi, ni);
      // reconstrói a lista global preservando as posições dos itens do grupo
      const fila = [...novaOrdemGrupo];
      const grupoSet = new Set(idsGrupo);
      const final = prev.map((p) => (grupoSet.has(p.id) ? prev.find((q) => q.id === fila.shift())! : p));
      salvarOrdem(final);
      return final;
    });
  }, [salvarOrdem]);

  const handleDragEndForGroup = useCallback(async (event: DragEndEvent, groupIds: string[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groupIds.indexOf(active.id as string);
    const newIndex = groupIds.indexOf(over.id as string);
    const reorderedGroupIds = arrayMove(groupIds, oldIndex, newIndex);
    const groupSet = new Set(groupIds);
    const fila = [...reorderedGroupIds];
    const final = produtos.map((p) => (groupSet.has(p.id) ? produtos.find((q) => q.id === fila.shift())! : p));
    setProdutos(final);
    salvarOrdem(final);
  }, [produtos, salvarOrdem]);

  // após salvar no modal: atualiza a lista in-place (edita) ou adiciona (novo)
  function onSaved(p: Produto) {
    setProdutos((prev) => {
      const existe = prev.some((x) => x.id === p.id);
      const editou = existe;
      const nova = editou ? prev.map((x) => (x.id === p.id ? { ...x, ...p } : x)) : [...prev, p];
      sucesso(editou ? "Produto atualizado!" : "Produto criado!");
      return nova;
    });
    setModalAlvo(null);
  }

  // exclusão via Confirm PADRÃO do site (mesmo modal/animação de todo o admin).
  // O histórico de estoque é sempre apagado junto (evita registros órfãos).
  async function excluir(produto: Produto) {
    const ok = await confirmar({
      titulo: "Remover produto",
      mensagem: `Remover "${produto.titulo}"? Esta ação é irreversível e também apaga o histórico de estoque dele.`,
      confirmar: "Remover",
    });
    if (!ok) return;
    const fd = new FormData();
    fd.append("id", produto.id);
    fd.append("apagarHistorico", "1");
    const result = await deleteProdutoAction(fd);
    if (result.ok) {
      setProdutos((prev) => prev.filter((p) => p.id !== produto.id));
      sucesso("Produto removido!");
    } else {
      toast.erro(result.error ?? "Erro ao remover produto.");
    }
  }

  // agrupa por categoria mantendo a ordem global
  const grupos: { categoriaId: string | null; nome: string; itens: Produto[] }[] = [];
  const visto = new Set<string | null>();
  for (const p of produtos) {
    const cid = p.categoriaId ?? null;
    if (!visto.has(cid)) {
      visto.add(cid);
      grupos.push({ categoriaId: cid, nome: cid ? (categoriaMap.get(cid) ?? "Sem categoria") : "Sem categoria", itens: [] });
    }
    grupos.find((g) => g.categoriaId === cid)!.itens.push(p);
  }

  return (
    <>
      {modalMount.mounted && (
        <ProdutoModal
          key={modalMount.key}
          open={modalMount.open}
          produto={modalMount.value.produto}
          categorias={categorias}
          onClose={() => setModalAlvo(null)}
          onSaved={onSaved}
        />
      )}

      {/* cabeçalho: novo produto */}
      <div className="flex justify-end -mb-2">
        <button
          onClick={() => setModalAlvo({ produto: null })}
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          <IconPlus size={16} /> Novo produto
        </button>
      </div>

      {produtos.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum produto cadastrado.</p>
      ) : (
      <>
      {/* resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { n: produtos.length, l: "Produtos", cls: "text-[#F5E6C8]" },
          { n: totalPublicados, l: "Publicados", cls: "text-[#F5E6C8]" },
          { n: estoqueBaixo, l: "Estoque baixo", cls: estoqueBaixo > 0 ? "text-amber-400" : "text-[#F5E6C8]" },
          { n: unidades, l: "Unid. em estoque", cls: "text-[#F5E6C8]" },
        ].map((s) => (
          <div key={s.l} className="bg-[#111] border border-[#2d2d2d] rounded-lg px-3.5 py-2.5">
            <p className={`text-xl font-bold tabular-nums ${s.cls}`}>{s.n}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {saving && <p className="text-xs text-gray-500 text-right -mb-2">Salvando ordem...</p>}

      <div className="flex flex-col gap-4">
        {grupos.map((grupo) => {
          const groupIds = grupo.itens.map((p) => p.id);
          return (
            <div key={grupo.categoriaId ?? "__sem__"} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#b8944a]">{grupo.nome}</span>
                <span className="text-[10px] text-gray-600">{grupo.itens.length} produto{grupo.itens.length !== 1 ? "s" : ""}</span>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEndForGroup(e, groupIds)}>
                <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
                  <div className="bg-[#111] border border-[#2d2d2d] rounded-lg overflow-hidden">
                    {grupo.itens.map((produto, i) => (
                      <SortableRow
                        key={produto.id}
                        produto={produto}
                        index={i}
                        total={grupo.itens.length}
                        onDelete={excluir}
                        onEstoque={onEstoque}
                        onMover={onMover}
                        onEdit={(p) => setModalAlvo({ produto: p })}
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
      )}
    </>
  );
}
