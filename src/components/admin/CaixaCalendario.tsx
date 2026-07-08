"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconChevronLeft, IconChevronRight, IconChevronDown, IconLock, IconLockOpen,
  IconPlus, IconTrash, IconTrendingDown, IconUser, IconCheck, IconX, IconClock, IconScissors,
  IconQrcode, IconCreditCard, IconCashBanknote,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { FechamentoDia } from "@/lib/agendamentos-types";
import type { Comanda, ItemComanda } from "@/lib/comandas-types";
import { calcularTotalItens } from "@/lib/comandas-types";
import type { GastoDia } from "@/lib/gastos-dia-tipos";
import Modal from "@/components/ui/Modal";
import { useModalMount } from "@/components/ui/useModalMount";

function brl(v: number) { return `R$ ${v.toFixed(2).replace(".", ",")}` }
function toDataStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-1.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full";
const FORMAS_PAG: { nome: string; icon: Icon }[] = [
  { nome: "Pix", icon: IconQrcode },
  { nome: "Cartão de débito", icon: IconCreditCard },
  { nome: "Cartão de crédito", icon: IconCreditCard },
  { nome: "Dinheiro", icon: IconCashBanknote },
];

// ── Modal de confirmação genérico ───────────────────────────────────────────────
function ModalConfirm({ open = true, titulo, mensagem, confirmLabel, confirmClass, onConfirm, onCancel }: {
  open?: boolean; titulo: string; mensagem: string; confirmLabel: string;
  confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-6 flex flex-col gap-4">
      <h3 className="font-bold text-[#F5E6C8]">{titulo}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{mensagem}</p>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">Cancelar</button>
        <button onClick={onConfirm} className={`px-4 py-2 text-sm rounded transition ${confirmClass}`}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

// ── Form de despesa do dia ──────────────────────────────────────────────────────
function FormGastoDia({ data, onSalvo, onCancelar }: { data: string; onSalvo: () => void; onCancelar: () => void; }) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!descricao.trim()) { setErro("Descrição obrigatória"); return; }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro("Valor inválido"); return; }
    setSalvando(true);
    const res = await fetch("/api/gastos-dia", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, descricao, valor: Number(valor) }),
    });
    setSalvando(false);
    if (res.ok) onSalvo(); else setErro("Erro ao salvar");
  }

  return (
    <div className="bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-4 flex flex-col gap-3 mt-2">
      <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Despesa do dia</p>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Produto comprado, material..." className={inp} />
      <input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor (R$)" className={inp} />
      <div className="flex gap-2">
        <button onClick={salvar} disabled={salvando} className="px-4 py-1.5 bg-red-900/50 border border-red-800/60 text-red-300 text-xs font-bold rounded hover:bg-red-900/70 transition disabled:opacity-50">
          {salvando ? "Salvando..." : "Registrar despesa"}
        </button>
        <button onClick={onCancelar} className="px-4 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] transition">Cancelar</button>
      </div>
    </div>
  );
}

// ── Itens + catálogo (compartilhado entre criar e finalizar comanda) ────────────
type CatalogItem = { id: string; titulo: string; preco: number; tipo: "servico" | "produto" };
type ItemForm = { catalogKey: string; tipo: "servico" | "produto"; descricao: string; valor: string; produtoId?: string };

function itensParaForm(itens?: ItemComanda[]): ItemForm[] {
  return itens?.map((i) => ({ catalogKey: "manual", tipo: i.tipo, descricao: i.descricao, valor: String(i.valor), produtoId: i.produtoId }))
    ?? [{ catalogKey: "manual", tipo: "servico", descricao: "", valor: "" }];
}

/** Carrega catálogo de serviços/produtos e gerencia a lista de itens editáveis. */
function useItensEditor(inicial?: ItemComanda[]) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [itens, setItens] = useState<ItemForm[]>(() => itensParaForm(inicial));

  useEffect(() => {
    let cancelado = false;
    async function carregar(tentativa = 0) {
      const [rs, rp] = await Promise.all([
        fetch("/api/admin/itens", { credentials: "include" }).catch(() => null),
        fetch("/api/admin/produtos", { credentials: "include" }).catch(() => null),
      ]);
      if ((!rs?.ok || !rp?.ok) && tentativa < 3) {
        setTimeout(() => { if (!cancelado) carregar(tentativa + 1); }, 500);
        return;
      }
      const s = rs?.ok ? await rs.json() : { items: [] };
      const p = rp?.ok ? await rp.json() : { produtos: [] };
      if (cancelado) return;
      const parsePreco = (v: unknown) => parseFloat(String(v).replace(",", ".")) || 0;
      const servs: CatalogItem[] = (s.items ?? []).filter((i: { status: string }) => i.status === "published").map((i: { id: string; titulo: string; preco: unknown }) => ({ ...i, preco: parsePreco(i.preco), tipo: "servico" as const }));
      const prods: CatalogItem[] = (p.produtos ?? []).filter((i: { status: string }) => i.status === "published").map((i: { id: string; titulo: string; preco: unknown }) => ({ ...i, preco: parsePreco(i.preco), tipo: "produto" as const }));
      setCatalog([...servs, ...prods]);
    }
    carregar();
    return () => { cancelado = true; };
  }, []);

  const servicos = catalog.filter((c) => c.tipo === "servico");
  const produtos = catalog.filter((c) => c.tipo === "produto");

  function addItem() { setItens((p) => [...p, { catalogKey: "manual", tipo: "servico", descricao: "", valor: "" }]); }
  function removeItem(i: number) { setItens((p) => p.filter((_, idx) => idx !== i)); }
  function changeTipo(i: number, tipo: "servico" | "produto") {
    setItens((p) => p.map((it, idx) => idx === i ? { ...it, tipo, catalogKey: "manual", descricao: "", valor: "", produtoId: undefined } : it));
  }
  function selecionarCatalog(i: number, key: string) {
    if (key === "manual") { setItens((p) => p.map((it, idx) => idx === i ? { ...it, catalogKey: "manual", descricao: "", valor: "", produtoId: undefined } : it)); return; }
    const found = catalog.find((c) => `${c.tipo[0]}:${c.id}` === key);
    if (found) setItens((p) => p.map((it, idx) => idx === i
      ? { catalogKey: key, tipo: found.tipo, descricao: found.titulo, valor: String(found.preco), produtoId: found.tipo === "produto" ? found.id : undefined }
      : it));
  }
  function updateValor(i: number, v: string) { setItens((p) => p.map((it, idx) => idx === i ? { ...it, valor: v } : it)); }
  function updateDesc(i: number, v: string) { setItens((p) => p.map((it, idx) => idx === i ? { ...it, descricao: v } : it)); }

  const somaItens = itens.reduce((s, it) => s + (Number(it.valor) || 0), 0);

  /** Converte para ItemComanda[] (só itens válidos). */
  function paraItensComanda(): ItemComanda[] {
    return itens
      .filter((i) => i.descricao.trim() && !isNaN(Number(i.valor)) && Number(i.valor) > 0)
      .map((it, idx) => ({
        id: String(Date.now() + idx), tipo: it.tipo, descricao: it.descricao.trim(), valor: Number(it.valor),
        ...(it.produtoId ? { produtoId: it.produtoId } : {}),
      }));
  }

  return { servicos, produtos, itens, addItem, removeItem, changeTipo, selecionarCatalog, updateValor, updateDesc, somaItens, paraItensComanda };
}

type ItensEditor = ReturnType<typeof useItensEditor>;

/** Renderiza a lista de itens editáveis (usa o hook useItensEditor). */
function ItensEditorView({ ed, titulo = "Itens *" }: { ed: ItensEditor; titulo?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">{titulo}</p>
        <button onClick={ed.addItem} className="flex items-center gap-1 text-[10px] text-[#b8944a]/70 hover:text-[#b8944a] transition font-semibold tracking-widest uppercase">
          <IconPlus size={10} /> Adicionar item
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {ed.itens.map((item, i) => {
          const catalogDaTipo = item.tipo === "servico" ? ed.servicos : ed.produtos;
          return (
            <div key={i} className="bg-[#0f0f0f] border border-[#2d2d2d] rounded-lg p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button onClick={() => ed.changeTipo(i, "servico")}
                    className={`px-3 py-1.5 text-xs rounded border transition ${item.tipo === "servico" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-500 border-[#2d2d2d] hover:border-[#b8944a]"}`}>✂️ Serviço</button>
                  <button onClick={() => ed.changeTipo(i, "produto")}
                    className={`px-3 py-1.5 text-xs rounded border transition ${item.tipo === "produto" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-500 border-[#2d2d2d] hover:border-[#b8944a]"}`}>📦 Produto</button>
                </div>
                {ed.itens.length > 1 && <button onClick={() => ed.removeItem(i)} className="text-gray-600 hover:text-red-400 transition p-1"><IconTrash size={13} /></button>}
              </div>
              <select value={item.catalogKey} onChange={(e) => ed.selecionarCatalog(i, e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#2d2d2d] rounded px-2.5 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]">
                <option value="manual">— Digitar manualmente —</option>
                {catalogDaTipo.map((c) => <option key={c.id} value={`${c.tipo[0]}:${c.id}`}>{c.titulo} — R$ {c.preco.toFixed(2).replace(".", ",")}</option>)}
              </select>
              {item.catalogKey === "manual" && (
                <input value={item.descricao} onChange={(e) => ed.updateDesc(i, e.target.value)} placeholder={item.tipo === "servico" ? "Nome do serviço..." : "Nome do produto..."} className={inp} />
              )}
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-gray-600 tracking-widest uppercase shrink-0">Valor (R$)</label>
                <input type="number" min="0" step="0.01" value={item.valor} onChange={(e) => ed.updateValor(i, e.target.value)} placeholder="0,00" className={`${inp} flex-1`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal criar/editar comanda ──────────────────────────────────────────────────
function FormComanda({ open = true, data, inicial, onSalvo, onCancelar }: {
  open?: boolean; data: string; inicial?: Comanda; onSalvo: () => void; onCancelar: () => void;
}) {
  const [clienteNome, setClienteNome] = useState(inicial?.clienteNome ?? "");
  const [clienteTelefone, setClienteTelefone] = useState(inicial?.clienteTelefone ?? "");
  const ed = useItensEditor(inicial?.itens);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function salvar() {
    if (!clienteNome.trim()) { setErro("Nome do cliente obrigatório"); return; }
    const itensFmt = ed.paraItensComanda();
    if (!itensFmt.length) { setErro("Adicione ao menos um item com descrição e valor válido"); return; }
    setErro(""); setSalvando(true);
    const payload = { data, clienteNome: clienteNome.trim(), clienteTelefone: clienteTelefone.trim() || undefined, itens: itensFmt };
    if (inicial) {
      await fetch(`/api/comandas/${inicial.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/comandas", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setSalvando(false); onSalvo();
  }

  return (
    <Modal open={open} onClose={onCancelar} className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[calc(100vh-2rem)]">
      <div className="flex items-center px-5 py-4 border-b border-[#1e1e1e]">
        <div>
          <h3 className="font-bold text-[#F5E6C8] text-sm">{inicial ? "Editar comanda" : "Nova comanda"}</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">{new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
        {erro && <p className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded px-3 py-2">{erro}</p>}

        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-2">Cliente</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente *" className={`${inp} col-span-2 sm:col-span-1`} />
            <input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} placeholder="Telefone (opcional)" className={`${inp} col-span-2 sm:col-span-1`} />
          </div>
        </div>

        <ItensEditorView ed={ed} />
      </div>

      <div className="px-5 py-4 border-t border-[#1e1e1e] flex gap-2 shrink-0">
        <button onClick={salvar} disabled={salvando} className="flex-1 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-[#c9a84c] transition disabled:opacity-50">
          {salvando ? "Salvando..." : inicial ? "Salvar comanda" : "Abrir comanda"}
        </button>
        <button onClick={onCancelar} className="px-5 py-2.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] transition">Cancelar</button>
      </div>
    </Modal>
  );
}

// ── Modal finalizar comanda (itens editáveis + total ajustável + pagamento) ─────
function FormFinalizar({ open = true, comanda, onFinalizado, onCancelar }: {
  open?: boolean; comanda: Comanda; onFinalizado: () => void; onCancelar: () => void;
}) {
  const [formaPagamento, setFormaPagamento] = useState(comanda.formaPagamento ?? "Pix");
  const [finalizando, setFinalizando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const ed = useItensEditor(comanda.itens);
  // Total editável: começa com a soma dos itens, mas o Igor pode sobrescrever.
  const [totalManual, setTotalManual] = useState<string | null>(null);
  const totalFinal = totalManual !== null ? (Number(totalManual) || 0) : ed.somaItens;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function finalizar() {
    setFinalizando(true);
    const itens = ed.paraItensComanda();
    // 1) salva itens editados + total ajustado
    await fetch(`/api/comandas/${comanda.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens, total: totalFinal }),
    });
    // 2) finaliza (baixa estoque, marca finalizada)
    await fetch(`/api/comandas/${comanda.id}/finalizar`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formaPagamento }),
    });
    setFinalizando(false);
    setSucesso(true);
    // mostra a animação de sucesso antes de fechar
    setTimeout(() => onFinalizado(), 1400);
  }

  return (
    <Modal open={open} onClose={onCancelar} className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[calc(100vh-2rem)]">
      <AnimatePresence>
        {sucesso && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#141414] rounded-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <IconCheck size={34} className="text-white" strokeWidth={3} />
            </motion.div>
            <motion.p className="text-sm font-bold text-green-400"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              Comanda finalizada!
            </motion.p>
            <motion.p className="text-lg font-bold text-[#F5E6C8]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              {brl(totalFinal)}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center px-5 py-4 border-b border-[#1e1e1e]">
        <div>
          <h3 className="font-bold text-[#F5E6C8] text-sm">Finalizar comanda</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">{comanda.clienteNome}</p>
        </div>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
        {/* Itens editáveis — pode adicionar serviço/produto na hora de pagar */}
        <ItensEditorView ed={ed} titulo="Itens da comanda" />

        {/* Total (editável) */}
        <div className="bg-[#0f0f0f] border border-[#2d2d2d] rounded-lg px-3 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-[#F5E6C8] tracking-widest uppercase">Total a cobrar</p>
            {totalManual !== null && Number(totalManual) !== ed.somaItens && (
              <p className="text-[10px] text-gray-500 mt-0.5">Soma dos itens: {brl(ed.somaItens)}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-[#b8944a]">R$</span>
            <input
              type="number" min="0" step="0.01"
              value={totalManual ?? ed.somaItens.toFixed(2)}
              onChange={(e) => setTotalManual(e.target.value)}
              className="w-24 bg-[#0A0A0A] border border-[#2d2d2d] rounded px-2 py-1.5 text-sm text-[#b8944a] font-bold text-right focus:outline-none focus:border-[#b8944a]"
            />
          </div>
        </div>

        {/* Forma de pagamento */}
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-2">Forma de pagamento</p>
          <div className="grid grid-cols-2 gap-1.5">
            {FORMAS_PAG.map(({ nome, icon: Icon }) => (
              <button key={nome} onClick={() => setFormaPagamento(nome)}
                className={`flex items-center gap-2 px-3 py-2 text-xs rounded border transition ${formaPagamento === nome ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
                <Icon size={15} className="shrink-0" />
                {nome}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-gray-500">Ao finalizar, os produtos serão baixados do estoque e a comanda entrará no caixa do dia.</p>
      </div>
      <div className="px-5 py-4 border-t border-[#1e1e1e] flex gap-2 shrink-0">
        <button onClick={finalizar} disabled={finalizando || sucesso} className="flex-1 py-2.5 bg-green-700 text-white text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-green-600 transition disabled:opacity-50">
          {finalizando ? "Finalizando..." : "Finalizar comanda"}
        </button>
        <button onClick={onCancelar} disabled={sucesso} className="px-5 py-2.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] transition disabled:opacity-50">Voltar</button>
      </div>
    </Modal>
  );
}

// ── Componente principal ────────────────────────────────────────────────────────
interface Props {
  fechamentos: FechamentoDia[];
  gastosDia: GastoDia[];
  comandas: Comanda[];
  onAtualizar: () => void;
}

export default function CaixaCalendario({ fechamentos, gastosDia, comandas, onAtualizar }: Props) {
  const hoje = new Date().toISOString().split("T")[0];

  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [mes, setMes] = useState(() => new Date().getMonth());
  const [calendarioAberto, setCalendarioAberto] = useState(true);
  const [diaSel, setDiaSel] = useState<string>(hoje);
  const [fechando, setFechando] = useState(false);
  const [erroFechar, setErroFechar] = useState("");
  // Toast de sucesso (criar comanda, fechar/reabrir caixa, reabrir comanda)
  const [toast, setToast] = useState<{ msg: string; tipo: "sucesso" | "info" } | null>(null);
  function mostrarToast(msg: string, tipo: "sucesso" | "info" = "sucesso") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2500);
  }

  const [mostraFormGasto, setMostraFormGasto] = useState(false);
  const [novaComanda, setNovaComanda] = useState(false);
  const [editandoComanda, setEditandoComanda] = useState<Comanda | null>(null);
  const [finalizandoComanda, setFinalizandoComanda] = useState<Comanda | null>(null);
  const [modalCancelar, setModalCancelar] = useState<Comanda | null>(null);
  const [modalReabrir, setModalReabrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);

  const novaComandaMount = useModalMount(novaComanda ? true : null);
  const editarMount = useModalMount(editandoComanda);
  const finalizarMount = useModalMount(finalizandoComanda);
  const cancelarMount = useModalMount(modalCancelar);
  const reabrirMount = useModalMount(modalReabrir ? true : null);
  const fecharMount = useModalMount(modalFechar ? true : null);

  const searchParams = useSearchParams();
  useEffect(() => {
    const p = searchParams.get("dia");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) {
      setDiaSel(p);
      const d = new Date(p + "T12:00:00");
      setAno(d.getFullYear()); setMes(d.getMonth());
      setTimeout(() => document.getElementById("caixa")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [searchParams]); // eslint-disable-line

  const fechPorData = Object.fromEntries(fechamentos.map((f) => [f.data, f]));
  const gastosPorData: Record<string, GastoDia[]> = {};
  gastosDia.forEach((g) => { gastosPorData[g.data] = [...(gastosPorData[g.data] ?? []), g]; });
  const comandasPorData: Record<string, Comanda[]> = {};
  comandas.forEach((c) => { comandasPorData[c.data] = [...(comandasPorData[c.data] ?? []), c]; });

  // Derivados do dia selecionado
  const fechDia = fechPorData[diaSel];
  const gastosDiaSel = gastosPorData[diaSel] ?? [];
  const totalGastosDiaSel = gastosDiaSel.reduce((s, g) => s + g.valor, 0);
  const comandasDia = comandasPorData[diaSel] ?? [];
  const abertas = comandasDia.filter((c) => c.status === "aberta");
  const finalizadas = fechDia ? (fechDia.comandas ?? []) : comandasDia.filter((c) => c.status === "finalizada");
  const totalFaturamento = fechDia?.totalServicos ?? finalizadas.reduce((s, c) => s + (c.total || 0), 0);
  const lucroLiquido = totalFaturamento - totalGastosDiaSel;
  const ehFuturo = diaSel > hoje;
  const ehHoje = diaSel === hoje;

  async function fecharCaixa() {
    setFechando(true); setErroFechar("");
    try {
      const res = await fetch("/api/fechamento", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: diaSel }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErroFechar(j.error ?? "Erro ao fechar o caixa");
      } else { mostrarToast("Caixa fechado!"); onAtualizar(); }
    } finally { setFechando(false); }
  }

  async function reabrirCaixa() {
    if (!fechDia) return;
    await fetch(`/api/fechamento/${fechDia.id}`, { method: "DELETE", credentials: "include" });
    setModalReabrir(false); mostrarToast("Caixa reaberto", "info"); onAtualizar();
  }

  async function cancelarComanda(id: string) {
    await fetch(`/api/comandas/${id}/cancelar`, { method: "POST", credentials: "include" });
    setModalCancelar(null); mostrarToast("Comanda cancelada", "info"); onAtualizar();
  }

  async function reabrirComanda(id: string) {
    const res = await fetch(`/api/comandas/${id}/reabrir`, { method: "POST", credentials: "include" });
    if (res.ok) { mostrarToast("Comanda reaberta", "info"); onAtualizar(); }
    else {
      const j = await res.json().catch(() => ({}));
      mostrarToast(j.error ?? "Não foi possível reabrir", "info");
    }
  }

  async function excluirGasto(id: string) {
    await fetch(`/api/gastos-dia/${id}`, { method: "DELETE", credentials: "include" });
    onAtualizar();
  }

  function navMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear()); setMes(d.getMonth());
  }

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(primeiroDia).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)];

  return (
    <>
      {/* ── Toast de sucesso ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 rounded-full px-4 py-2 shadow-xl text-sm font-medium border ${
              toast.tipo === "sucesso"
                ? "bg-[#1a2a1a] border-green-700/60 text-green-300"
                : "bg-[#1a1a2a] border-[#b8944a]/50 text-[#F5E6C8]"
            }`}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
          >
            <IconCheck size={15} className={toast.tipo === "sucesso" ? "text-green-400" : "text-[#b8944a]"} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modais ── */}
      {novaComandaMount.mounted && (
        <FormComanda key={novaComandaMount.key} open={novaComandaMount.open} data={diaSel}
          onSalvo={() => { setNovaComanda(false); mostrarToast("Comanda aberta!"); onAtualizar(); }} onCancelar={() => setNovaComanda(false)} />
      )}
      {editarMount.mounted && editarMount.value && (
        <FormComanda open={editarMount.open} data={diaSel} inicial={editarMount.value}
          onSalvo={() => { setEditandoComanda(null); onAtualizar(); }} onCancelar={() => setEditandoComanda(null)} />
      )}
      {finalizarMount.mounted && finalizarMount.value && (
        <FormFinalizar open={finalizarMount.open} comanda={finalizarMount.value}
          onFinalizado={() => { setFinalizandoComanda(null); onAtualizar(); }} onCancelar={() => setFinalizandoComanda(null)} />
      )}
      {cancelarMount.mounted && cancelarMount.value && (
        <ModalConfirm open={cancelarMount.open} titulo="Cancelar comanda?"
          mensagem={`A comanda de ${cancelarMount.value.clienteNome} será cancelada e não entrará no caixa.`}
          confirmLabel="Cancelar comanda" confirmClass="bg-red-900/60 text-red-300 border border-red-800/60 hover:bg-red-900/80"
          onConfirm={() => cancelarMount.value && cancelarComanda(cancelarMount.value.id)} onCancel={() => setModalCancelar(null)} />
      )}
      {reabrirMount.mounted && (
        <ModalConfirm open={reabrirMount.open} titulo="Reabrir caixa?"
          mensagem="O fechamento será excluído e as comandas voltarão ao estado editável."
          confirmLabel="Reabrir" confirmClass="bg-red-900/60 text-red-300 border border-red-800/60 hover:bg-red-900/80"
          onConfirm={reabrirCaixa} onCancel={() => setModalReabrir(false)} />
      )}
      {fecharMount.mounted && (
        <ModalConfirm open={fecharMount.open} titulo="Fechar o caixa?"
          mensagem={`Os atendimentos de ${new Date(diaSel + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} serão consolidados. Você ainda poderá reabrir caso precise corrigir algo.`}
          confirmLabel={fechando ? "Fechando..." : "Fechar caixa"} confirmClass="bg-[#b8944a] text-[#0A0A0A] font-bold hover:bg-[#c9a84c]"
          onConfirm={() => { setModalFechar(false); fecharCaixa(); }} onCancel={() => setModalFechar(false)} />
      )}

      <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden">
        {/* ── Cabeçalho ── */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#1e1e1e]">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#b8944a]/10 border border-[#b8944a]/20">
            <IconScissors size={14} className="text-[#b8944a]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#F5E6C8] tracking-wide">Caixa</p>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Comandas, fechamentos e gastos por dia</p>
          </div>
        </div>

        {/* ── Calendário colapsável no topo ── */}
        <div className="p-5 border-b border-[#2d2d2d]">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navMes(-1)} className="p-1 text-gray-500 hover:text-gray-300 transition"><IconChevronLeft size={16} /></button>
            <button onClick={() => setCalendarioAberto((v) => !v)} className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#F5E6C8] hover:text-[#b8944a] transition">
              {MESES[mes]} {ano}
              <IconChevronDown size={14} className={`text-gray-500 transition-transform ${calendarioAberto ? "" : "-rotate-90"}`} />
            </button>
            <button onClick={() => navMes(1)} className="p-1 text-gray-500 hover:text-gray-300 transition"><IconChevronRight size={16} /></button>
          </div>
          {calendarioAberto && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {DIAS.map((d) => <div key={d} className="text-center text-[9px] font-medium tracking-widest text-gray-600 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((dia, i) => {
                  if (dia === null) return <div key={`e-${i}`} />;
                  const dataCel = toDataStr(ano, mes, dia);
                  const fech = fechPorData[dataCel];
                  const gastosNoDia = (gastosPorData[dataCel] ?? []).reduce((s, g) => s + g.valor, 0);
                  const comsDia = comandasPorData[dataCel] ?? [];
                  const fat = fech?.totalServicos ?? comsDia.filter((c) => c.status === "finalizada").reduce((s, c) => s + (c.total || 0), 0);
                  const temAbertas = comsDia.some((c) => c.status === "aberta");
                  const liquido = fat - gastosNoDia;
                  const eHoje = dataCel === hoje;
                  const sel = dataCel === diaSel;
                  const futuro = dataCel > hoje;

                  let borderCls = "border-transparent";
                  if (sel) borderCls = "border-[#F5E6C8]/40";
                  else if (temAbertas) borderCls = "border-amber-700/50";
                  else if (eHoje && !fech) borderCls = "border-[#F5E6C8]/15";
                  else if (fech && liquido > 0) borderCls = "border-green-900/50";
                  else if ((fech || gastosNoDia > 0) && liquido <= 0) borderCls = "border-red-900/50";

                  return (
                    <button key={dataCel} onClick={() => setDiaSel(dataCel)}
                      className={`relative flex flex-col items-center justify-center py-2 rounded border transition-all ${borderCls} ${sel ? "bg-[#1a1a1a]" : "hover:bg-[#0f0f0f]"} ${futuro && !sel ? "opacity-25" : ""}`}>
                      <span className={`text-xs font-medium ${eHoje ? "text-white" : fech ? "text-[#F5E6C8]" : "text-gray-500"}`}>{dia}</span>
                      {fech && <span className={`text-[9px] font-medium leading-none mt-0.5 hidden sm:block ${liquido >= 0 ? "text-green-400" : "text-red-400"}`}>{liquido >= 0 ? "+" : "−"}{brl(Math.abs(liquido)).replace("R$ ", "R$")}</span>}
                      {temAbertas && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />}
                      {eHoje && !fech && !temAbertas && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#b8944a]" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[#111]">
                {[
                  { cls: "border-green-900/50", label: "LUCRO POSITIVO" },
                  { cls: "border-red-900/50", label: "SALDO NEGATIVO / GASTO" },
                  { cls: "border-amber-700/50", label: "COMANDA EM ABERTO" },
                  { cls: "border-[#F5E6C8]/15", label: "HOJE" },
                ].map(({ cls, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 border rounded-sm ${cls}`} />
                    <span className="text-[9px] font-medium tracking-widest text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Painel do dia ── */}
        <div className="p-5">
          {/* Header do dia */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-sm font-bold text-[#F5E6C8] tracking-widest">
              {new Date(diaSel + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
            {fechDia && <span className="flex items-center gap-1 text-[10px] text-gray-500 border border-[#2d2d2d] rounded px-1.5 py-0.5"><IconLock size={9} /> FECHADO</span>}
            {ehHoje && !fechDia && <span className="text-[10px] font-bold tracking-widest text-[#b8944a] border border-[#b8944a]/30 rounded px-1.5 py-0.5">HOJE</span>}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 mb-0.5">FATURAMENTO</p>
              <p className="text-lg font-bold text-[#F5E6C8]">{brl(totalFaturamento)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 mb-0.5">GASTOS</p>
              <p className="text-lg font-bold text-red-400">{brl(totalGastosDiaSel)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 mb-0.5">LÍQUIDO</p>
              <p className={`text-lg font-bold ${lucroLiquido >= 0 ? "text-green-400" : "text-red-400"}`}>{brl(lucroLiquido)}</p>
            </div>
          </div>

          {/* ── Card: Comandas finalizadas (dentro do caixa) ── */}
          {finalizadas.length > 0 && (
            <div className="mb-4 border border-[#1a1a1a] rounded-lg overflow-hidden">
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 px-3 pt-2.5 pb-1">Comandas finalizadas</p>
              {finalizadas.map((c) => (
                <div key={c.id} className="border-t border-[#1a1a1a] px-3 py-2">
                  <div className="flex justify-between items-center text-xs gap-2">
                    <span className="text-[#F5E6C8] flex items-center gap-1.5 min-w-0"><IconCheck size={11} className="text-green-500 shrink-0" /> <span className="truncate">{c.clienteNome}</span></span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[#b8944a] font-medium">{brl(c.total)}</span>
                      {!fechDia && (
                        <button onClick={() => reabrirComanda(c.id)} title="Reabrir comanda"
                          className="flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase text-gray-600 hover:text-amber-400 border border-[#2d2d2d] hover:border-amber-700/50 rounded px-1.5 py-0.5 transition">
                          <IconLockOpen size={10} /> Reabrir
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="pl-4 mt-0.5">
                    {c.itens.map((it) => (
                      <div key={it.id} className="flex justify-between text-[11px] text-gray-600">
                        <span>{it.tipo === "produto" ? "📦" : "✂️"} {it.descricao}</span><span>{brl(it.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!fechDia && finalizadas.length === 0 && (
            <p className="text-sm text-gray-500 mb-4">Nenhuma comanda finalizada neste dia.</p>
          )}

          {/* ── Gastos do dia ── */}
          {gastosDiaSel.length > 0 && (
            <div className="flex flex-col divide-y divide-[#111] mb-4 border-t border-[#1a1a1a] pt-2">
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 pb-1.5">Gastos do dia</p>
              {gastosDiaSel.map((g) => (
                <div key={g.id} className="flex justify-between items-center py-1.5 text-xs">
                  <span className="text-gray-400">{g.descricao}</span>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-red-400 font-medium">−{brl(g.valor)}</span>
                    {!fechDia && <button onClick={() => excluirGasto(g.id)} className="text-gray-700 hover:text-red-400 transition"><IconTrash size={11} /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Form gasto ── */}
          {mostraFormGasto && !fechDia && (
            <FormGastoDia data={diaSel} onSalvo={() => { setMostraFormGasto(false); onAtualizar(); }} onCancelar={() => setMostraFormGasto(false)} />
          )}

          {/* ── Botões de ação ── */}
          {!mostraFormGasto && (
            <div className="mt-3">
              {erroFechar && <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded px-3 py-2 mb-2">{erroFechar}</p>}
              {!fechDia ? (
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setNovaComanda(true)} disabled={ehFuturo}
                    className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-widest bg-[#b8944a]/15 border border-[#b8944a]/40 text-[#b8944a] hover:bg-[#b8944a]/25 hover:border-[#b8944a] px-2 py-3 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed">
                    <IconPlus size={15} /> NOVA COMANDA
                  </button>
                  <button onClick={() => setMostraFormGasto(true)} disabled={ehFuturo}
                    className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-widest bg-red-950/40 border border-red-900/50 text-red-400/90 hover:border-red-800 hover:text-red-400 px-2 py-3 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed">
                    <IconTrendingDown size={15} /> DESPESA
                  </button>
                  <button onClick={() => setModalFechar(true)} disabled={fechando || ehFuturo}
                    className="flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-widest bg-[#1a1a1a] border border-[#2d2d2d] text-gray-400 hover:bg-[#222] hover:text-[#F5E6C8] px-2 py-3 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed">
                    <IconLock size={15} /> {fechando ? "FECHANDO..." : "FECHAR CAIXA"}
                  </button>
                </div>
              ) : (
                <button onClick={() => setModalReabrir(true)}
                  className="w-full flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest border border-[#2d2d2d] text-gray-600 hover:border-red-800/60 hover:text-red-400 px-4 py-2.5 rounded-lg transition">
                  <IconLockOpen size={11} /> REABRIR CAIXA
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Card SEPARADO: Comandas do dia (abertas) ── */}
      {!fechDia && !ehFuturo && (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 mt-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-[#F5E6C8]">Comandas do dia</p>
            <button onClick={() => setNovaComanda(true)} className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-[#b8944a]/80 hover:text-[#b8944a] transition">
              <IconPlus size={11} /> Nova
            </button>
          </div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 mb-3">
            {abertas.length > 0 ? `${abertas.length} comanda${abertas.length > 1 ? "s" : ""} em aberto` : "Nenhuma comanda em aberto"}
          </p>
          {abertas.length === 0 ? (
            <p className="text-xs text-gray-500">Comandas abertas aparecem aqui até serem finalizadas ou canceladas.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {abertas.map((c) => (
                <div key={c.id} className="bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <IconUser size={12} className="text-[#b8944a]/60 shrink-0" />
                        <span className="text-sm font-medium text-[#F5E6C8] truncate">{c.clienteNome}</span>
                        {c.origem === "agendamento" && c.horario && (
                          <span className="flex items-center gap-0.5 text-[9px] text-gray-500 border border-[#2d2d2d] rounded px-1 py-0.5"><IconClock size={9} /> {c.horario}</span>
                        )}
                      </div>
                      <div className="pl-5 mt-1">
                        {c.itens.map((it) => (
                          <div key={it.id} className="flex justify-between text-[11px] text-gray-500 gap-3">
                            <span className="truncate">{it.tipo === "produto" ? "📦" : "✂️"} {it.descricao}</span>
                            <span className="shrink-0">{brl(it.valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#b8944a] shrink-0">{brl(c.total)}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setFinalizandoComanda(c)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest uppercase bg-green-700/90 text-white hover:bg-green-600 px-3 py-2 rounded-lg transition">
                      <IconCheck size={12} /> Finalizar
                    </button>
                    <button onClick={() => setEditandoComanda(c)}
                      className="px-3 py-2 border border-[#2d2d2d] text-gray-400 text-[10px] font-bold tracking-widest uppercase rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition">
                      Editar
                    </button>
                    <button onClick={() => setModalCancelar(c)}
                      className="px-3 py-2 border border-[#2d2d2d] text-gray-600 hover:border-red-800/60 hover:text-red-400 rounded-lg transition">
                      <IconX size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
