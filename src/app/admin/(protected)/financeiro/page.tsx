"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAdminNotificacoes, type VencimentoItem } from "@/hooks/useAdminNotificacoes";
import {
  Receipt, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Settings, X, Check, Bell, BellOff, CalendarDays, ChevronDown, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { FechamentoDia, AtendimentoAvulso } from "@/lib/agendamentos-types";
import type { Gasto, CategoriaGasto, FrequenciaGasto, CategoriaGastoCustom } from "@/lib/gastos-tipos";
import type { GastoDia } from "@/lib/gastos-dia-tipos";
import CaixaCalendario from "@/components/admin/CaixaCalendario";
import { CATEGORIA_LABEL, FREQUENCIA_LABEL, gastoMensalEquivalente } from "@/lib/gastos-tipos";

function brl(v: number) { return `R$ ${v.toFixed(2).replace(".", ",")}` }
const card = "bg-[#111] border border-[#2d2d2d] rounded-lg";
const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-1.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

type Periodo = "7d" | "30d" | "mes_atual" | "mes_anterior" | "tudo";
const PERIODO_LABEL: Record<Periodo, string> = { "7d": "Últimos 7 dias", "30d": "Últimos 30 dias", "mes_atual": "Este mês", "mes_anterior": "Mês anterior", "tudo": "Todo período" };
const DONUT_COLORS = ["#C9A84C", "#a07830", "#6b5020", "#8b6914", "#d4b060", "#e8c878"];

interface PontoGrafico { data: string; fat: number; gastos: number; lucro: number }

function mesLabel(y: number, m: number) {
  const l = new Date(y, m, 1).toLocaleDateString("pt-BR", { month: "short" });
  return l.charAt(0).toUpperCase() + l.slice(1, 3);
}

function calcDadosGrafico(
  p: Periodo,
  fechamentos: FechamentoDia[],
  gastosDia: GastoDia[],
): PontoGrafico[] {
  const agora = new Date();

  const fatPorData: Record<string, number> = {};
  fechamentos.forEach((f) => { fatPorData[f.data] = f.totalServicos; });

  const gastosPorData: Record<string, number> = {};
  gastosDia.forEach((g) => { gastosPorData[g.data] = (gastosPorData[g.data] ?? 0) + g.valor; });

  if (p === "tudo") {
    const todasDatas = [...fechamentos.map((f) => f.data), ...gastosDia.map((g) => g.data)];
    if (todasDatas.length === 0) return [];
    const antiga = todasDatas.sort()[0];
    const inicioY = Number(antiga.slice(0, 4));
    const inicioM = Number(antiga.slice(5, 7)) - 1;
    const fatPorMes: Record<string, number> = {};
    fechamentos.forEach((f) => { const k = f.data.slice(0, 7); fatPorMes[k] = (fatPorMes[k] ?? 0) + f.totalServicos; });
    const gastosPorMes: Record<string, number> = {};
    gastosDia.forEach((g) => { const k = g.data.slice(0, 7); gastosPorMes[k] = (gastosPorMes[k] ?? 0) + g.valor; });
    const pontos: PontoGrafico[] = [];
    let cy = inicioY, cm = inicioM, acum = 0, acumGastos = 0;
    const fimY = agora.getFullYear(), fimM = agora.getMonth();
    while (cy < fimY || (cy === fimY && cm <= fimM)) {
      const key = `${cy}-${String(cm + 1).padStart(2, "0")}`;
      const fat = fatPorMes[key] ?? 0;
      const gastos = gastosPorMes[key] ?? 0;
      acum += fat; acumGastos += gastos;
      if (fat > 0 || gastos > 0) pontos.push({ data: mesLabel(cy, cm), fat: acum, gastos, lucro: acum - acumGastos });
      cm++; if (cm > 11) { cm = 0; cy++; }
    }
    return pontos;
  }

  // Períodos diários — determina intervalo
  let dataInicio: Date;
  let dataFim: Date;
  if (p === "7d") {
    dataInicio = new Date(agora); dataInicio.setDate(dataInicio.getDate() - 6);
    dataFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  } else if (p === "30d") {
    dataInicio = new Date(agora); dataInicio.setDate(dataInicio.getDate() - 29);
    dataFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  } else if (p === "mes_atual") {
    dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    dataFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  } else {
    const m = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1;
    const y = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
    dataInicio = new Date(y, m, 1);
    dataFim = new Date(agora.getFullYear(), agora.getMonth(), 1);
  }

  let acum = 0, acumGastos = 0;
  const pontos: PontoGrafico[] = [];
  const d = new Date(dataInicio);
  while (d < dataFim) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const fat = fatPorData[key] ?? 0;
    const gastos = gastosPorData[key] ?? 0;
    acum += fat; acumGastos += gastos;
    if (fat > 0 || gastos > 0) {
      pontos.push({ data: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), fat: acum, gastos, lucro: acum - acumGastos });
    }
    d.setDate(d.getDate() + 1);
  }
  return pontos;
}

// ── Paleta de cores para categorias ───────────────────────────────────────────
const PALETTE = [
  "#F59E0B","#F97316","#EF4444","#EC4899","#A855F7","#3B82F6",
  "#06B6D4","#10B981","#22C55E","#84CC16","#6B7280","#B45309",
];

// ── Modal de categorias ───────────────────────────────────────────────────────
function ModalCategorias({ categorias, onFechar, onChanged }: {
  categorias: CategoriaGastoCustom[];
  onFechar: () => void;
  onChanged: () => void;
}) {
  const [editando, setEditando] = useState<CategoriaGastoCustom | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState(PALETTE[0]);
  const [hexInput, setHexInput] = useState(PALETTE[0]);
  const [mostraForm, setMostraForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  function abrirNova() { setEditando(null); setNovoNome(""); setNovaCor(PALETTE[0]); setHexInput(PALETTE[0]); setMostraForm(true); }
  function abrirEditar(c: CategoriaGastoCustom) { setEditando(c); setNovoNome(c.nome); setNovaCor(c.cor); setHexInput(c.cor); setMostraForm(true); }
  function fecharForm() { setMostraForm(false); setEditando(null); }
  function escolherCor(cor: string) { setNovaCor(cor); setHexInput(cor); }
  function onHexChange(v: string) { setHexInput(v); if (/^#[0-9a-fA-F]{6}$/.test(v)) setNovaCor(v); }

  async function salvar() {
    if (!novoNome.trim()) return;
    setSalvando(true);
    if (editando) {
      await fetch(`/api/gastos/categorias/${editando.id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim(), cor: novaCor }),
      });
    } else {
      await fetch("/api/gastos/categorias", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim(), cor: novaCor }),
      });
    }
    setSalvando(false); fecharForm(); onChanged();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta categoria? Gastos vinculados não serão afetados.")) return;
    await fetch(`/api/gastos/categorias/${id}`, { method: "DELETE", credentials: "include" });
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-sm flex flex-col" style={{ maxHeight: "calc(100dvh - 2rem)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e] shrink-0">
          <h3 className="font-bold text-[#F5E6C8] text-sm">Categorias de gastos</h3>
          <button onClick={onFechar} className="text-gray-600 hover:text-gray-300 transition"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col divide-y divide-[#1a1a1a] px-2 py-2">
            {categorias.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                <span className="flex-1 text-sm text-[#F5E6C8]">{c.nome}</span>
                <button onClick={() => abrirEditar(c)} className="text-gray-600 hover:text-gray-300 transition p-1"><Edit2 size={13} /></button>
                <button onClick={() => excluir(c.id)} className="text-gray-600 hover:text-red-400 transition p-1"><Trash2 size={13} /></button>
              </div>
            ))}
            {categorias.length === 0 && <p className="text-xs text-gray-600 px-3 py-4 text-center">Nenhuma categoria ainda.</p>}
          </div>

          {mostraForm && (
            <div className="px-5 pb-4 flex flex-col gap-3 border-t border-[#1e1e1e] pt-4">
              <p className="text-[10px] font-bold tracking-widest text-[#b8944a] uppercase">{editando ? "Editar categoria" : "Nova categoria"}</p>
              <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome da categoria" className={`${inp} w-full`} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Cor</p>
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                  {PALETTE.map((cor) => (
                    <button key={cor} onClick={() => escolherCor(cor)}
                      className={`w-8 h-8 rounded-md border-2 transition ${novaCor === cor ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: cor }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded border border-[#2d2d2d]" style={{ backgroundColor: novaCor }} />
                  <input value={hexInput} onChange={(e) => onHexChange(e.target.value)} placeholder="#000000" maxLength={7}
                    className="bg-[#0A0A0A] border border-[#2d2d2d] rounded px-2 py-1 text-xs text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-24" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={salvar} disabled={salvando || !novoNome.trim()}
                  className="px-4 py-1.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50">
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={fecharForm} className="px-4 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] transition">Cancelar</button>
              </div>
            </div>
          )}
        </div>
        {!mostraForm && (
          <div className="px-5 py-3 border-t border-[#1e1e1e] shrink-0">
            <button onClick={abrirNova} className="w-full text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-[#b8944a] transition py-1">
              + Nova categoria
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form gasto (modal) ────────────────────────────────────────────────────────
function FormGasto({ inicial, categorias, onSalvar, onCancelar, salvando }: {
  inicial?: Partial<Gasto>;
  categorias: CategoriaGastoCustom[];
  onSalvar: (d: Partial<Gasto>) => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [categoriaId, setCategoriaId] = useState(inicial?.categoriaId ?? (categorias[0]?.id ?? ""));
  const [valor, setValor] = useState(String(inicial?.valor ?? ""));
  const [frequencia, setFrequencia] = useState<FrequenciaGasto>(inicial?.frequencia ?? "mensal");
  const [ativo, setAtivo] = useState(inicial?.ativo ?? true);
  const [proximoVencimento, setProximoVencimento] = useState(inicial?.proximoVencimento ?? "");
  const [lembrarRenovacao, setLembrarRenovacao] = useState(inicial?.lembrarRenovacao ?? false);
  const [erro, setErro] = useState("");

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const catSel = categorias.find((c) => c.id === categoriaId);
  const isUnico = frequencia === "unico";

  function submit() {
    if (!descricao.trim()) { setErro("Descrição obrigatória"); return; }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro("Valor inválido"); return; }
    if (!categoriaId && categorias.length > 0) { setErro("Selecione uma categoria"); return; }
    setErro("");
    onSalvar({
      descricao, categoriaId: categoriaId || undefined,
      categoria: "outros" as CategoriaGasto,
      valor: Number(valor), frequencia, ativo,
      vencimento: null,
      proximoVencimento: !isUnico && proximoVencimento ? proximoVencimento : undefined,
      lembrarRenovacao: !isUnico ? lembrarRenovacao : false,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancelar}>
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "calc(100dvh - 2rem)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e] shrink-0">
          <h3 className="font-bold text-[#F5E6C8] text-sm">{inicial?.id ? "Editar gasto" : "Novo gasto"}</h3>
          <button onClick={onCancelar} className="text-gray-600 hover:text-gray-300 transition"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 flex flex-col gap-4">
          {erro && <p className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded px-3 py-2">{erro}</p>}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Descrição *</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Aluguel do espaço" className={`${inp} w-full`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Valor (R$) *</label>
              <input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={`${inp} w-full`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Frequência *</label>
              <select value={frequencia} onChange={(e) => setFrequencia(e.target.value as FrequenciaGasto)} className={`${inp} w-full`}>
                {(Object.keys(FREQUENCIA_LABEL) as FrequenciaGasto[]).map((f) => <option key={f} value={f}>{FREQUENCIA_LABEL[f]}</option>)}
              </select>
            </div>
          </div>

          {categorias.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Categoria</label>
              <div className="flex flex-wrap gap-1.5">
                {categorias.map((c) => (
                  <button key={c.id} onClick={() => setCategoriaId(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition ${categoriaId === c.id ? "border-white/40 bg-white/5 text-[#F5E6C8]" : "border-[#2d2d2d] text-gray-500 hover:border-[#444]"}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                    {c.nome}
                    {categoriaId === c.id && <Check size={10} className="text-[#b8944a]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isUnico && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Próximo vencimento</label>
              <input type="date" value={proximoVencimento} onChange={(e) => setProximoVencimento(e.target.value)}
                className={`${inp} w-full`} />
            </div>
          )}

          {!isUnico && (
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-[#2d2d2d] hover:border-[#3d3d3d] transition">
              <div className="relative mt-0.5">
                <input type="checkbox" checked={lembrarRenovacao} onChange={(e) => setLembrarRenovacao(e.target.checked)} className="sr-only" />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${lembrarRenovacao ? "bg-[#b8944a] border-[#b8944a]" : "border-[#3d3d3d]"}`}>
                  {lembrarRenovacao && <Check size={10} className="text-[#0A0A0A]" />}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F5E6C8]">Lembrar renovação</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Avisar 10 dias, 3 dias antes e no dia do vencimento</p>
              </div>
              {lembrarRenovacao ? <Bell size={14} className="text-[#b8944a] shrink-0 ml-auto mt-0.5" /> : <BellOff size={14} className="text-gray-600 shrink-0 ml-auto mt-0.5" />}
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="accent-[#b8944a]" />
            Gasto ativo
          </label>
        </div>
        <div className="px-5 py-4 border-t border-[#1e1e1e] flex gap-2 shrink-0">
          <button onClick={submit} disabled={salvando}
            className="flex-1 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-[#c9a84c] transition disabled:opacity-50">
            {salvando ? "Salvando..." : inicial?.id ? "Salvar alterações" : "Cadastrar gasto"}
          </button>
          <button onClick={onCancelar} className="px-5 py-2.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] transition">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [gastosDia, setGastosDia] = useState<GastoDia[]>([]);
  const [avulsos, setAvulsos] = useState<AtendimentoAvulso[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGastoCustom[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("mes_atual");
  const [mostraFormGasto, setMostraFormGasto] = useState(false);
  const [editandoGasto, setEditandoGasto] = useState<Gasto | null>(null);
  const [salvandoGasto, setSalvandoGasto] = useState(false);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [fechExpandido, setFechExpandido] = useState<string | null>(null);
  const notif = useAdminNotificacoes();
  const [pagarModal, setPagarModal] = useState<VencimentoItem | null>(null);
  const [pagarValor, setPagarValor] = useState("");
  const [pagarStep, setPagarStep] = useState<1 | 2>(1);
  const [pagando, setPagando] = useState(false);

  function abrirPagamento(v: VencimentoItem) {
    setPagarModal(v);
    setPagarValor(String(v.valor));
    setPagarStep(1);
  }

  async function confirmarPagamento() {
    if (!pagarModal) return;
    if (pagarStep === 1) { setPagarStep(2); return; }
    setPagando(true);
    await fetch(`/api/gastos/${pagarModal.id}/pagar`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valorPago: Number(pagarValor) }),
    });
    setPagando(false);
    setPagarModal(null);
    carregar();
  }
  const [gastoExpandido, setGastoExpandido] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const [resFech, resGastos, resGastosDia, resAvulsos, resCats] = await Promise.all([
      fetch("/api/fechamento", { credentials: "include" }),
      fetch("/api/gastos", { credentials: "include" }),
      fetch("/api/gastos-dia", { credentials: "include" }),
      fetch("/api/atendimentos-avulsos", { credentials: "include" }),
      fetch("/api/gastos/categorias", { credentials: "include" }),
    ]);
    if (resFech.ok) setFechamentos(await resFech.json());
    if (resGastos.ok) setGastos(await resGastos.json());
    if (resGastosDia.ok) setGastosDia(await resGastosDia.json());
    if (resAvulsos.ok) setAvulsos(await resAvulsos.json());
    if (resCats.ok) setCategorias(await resCats.json());
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvarGasto(data: Partial<Gasto>) {
    setSalvandoGasto(true);
    if (editandoGasto) {
      await fetch(`/api/gastos/${editandoGasto.id}`, { credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setEditandoGasto(null);
    } else {
      await fetch("/api/gastos", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setMostraFormGasto(false);
    }
    setSalvandoGasto(false);
    carregar();
  }

  async function toggleGasto(g: Gasto) {
    await fetch(`/api/gastos/${g.id}`, { credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !g.ativo }) });
    carregar();
  }

  async function excluirGasto(id: string) {
    if (!confirm("Excluir este gasto?")) return;
    await fetch(`/api/gastos/${id}`, { credentials: "include", method: "DELETE" });
    carregar();
  }

  function getFechamentosPeriodo(p: Periodo): FechamentoDia[] {
    if (p === "tudo") return [...fechamentos];
    const agora = new Date();
    return fechamentos.filter((f) => {
      const d = new Date(f.data + "T12:00:00");
      if (p === "7d") { const l = new Date(agora); l.setDate(l.getDate() - 7); return d >= l; }
      if (p === "30d") { const l = new Date(agora); l.setDate(l.getDate() - 30); return d >= l; }
      if (p === "mes_atual") return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
      if (p === "mes_anterior") { const m = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1; const y = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear(); return d.getMonth() === m && d.getFullYear() === y; }
      return false;
    });
  }

  const fechsPeriodo = getFechamentosPeriodo(periodo).sort((a, b) => a.data.localeCompare(b.data));
  const totalPeriodo = fechsPeriodo.reduce((s, f) => s + f.totalServicos, 0);
  const servicosPeriodo = fechsPeriodo.reduce((s, f) => s + f.quantidadeAtendidos, 0);
  const ticketPeriodo = servicosPeriodo > 0 ? totalPeriodo / servicosPeriodo : 0;

  const fechsAnt = (() => {
    const agora = new Date();
    if (periodo === "mes_atual") { const m = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1; const y = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear(); return fechamentos.filter((f) => { const d = new Date(f.data + "T12:00:00"); return d.getMonth() === m && d.getFullYear() === y; }); }
    if (periodo === "7d") { const fim = new Date(agora); fim.setDate(fim.getDate() - 7); const ini = new Date(agora); ini.setDate(ini.getDate() - 14); return fechamentos.filter((f) => { const d = new Date(f.data + "T12:00:00"); return d >= ini && d < fim; }); }
    return [];
  })();
  const totalAnt = fechsAnt.reduce((s, f) => s + f.totalServicos, 0);
  const varPct = totalAnt > 0 ? ((totalPeriodo - totalAnt) / totalAnt) * 100 : null;

  const gastosDiaPorData: Record<string, number> = {};
  gastosDia.forEach((g) => { gastosDiaPorData[g.data] = (gastosDiaPorData[g.data] ?? 0) + g.valor; });

  const dadosGrafico = calcDadosGrafico(periodo, fechamentos, gastosDia);
  const totalGrafico = dadosGrafico.reduce((s, d) => s + d.fat, 0);
  const totalGastosGrafico = dadosGrafico.reduce((s, d) => s + d.gastos, 0);

  const gastosAtivos = gastos.filter((g) => g.ativo);
  const totalMensalGastos = gastosAtivos.reduce((s, g) => s + gastoMensalEquivalente(g), 0);
  const lucroEstimado = totalPeriodo - totalMensalGastos;

  // Resolve nome e cor de cada gasto (categoria customizada tem prioridade)
  const porCategoria: Record<string, number> = {};
  const corPorCategoria: Record<string, string> = {};
  gastosAtivos.forEach((g) => {
    const custom = g.categoriaId ? categorias.find((c) => c.id === g.categoriaId) : null;
    const nome = custom?.nome ?? CATEGORIA_LABEL[g.categoria] ?? "Outros";
    const cor = custom?.cor ?? "#6B7280";
    porCategoria[nome] = (porCategoria[nome] ?? 0) + gastoMensalEquivalente(g);
    corPorCategoria[nome] = cor;
  });
  const donutData = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  const melhorDia = fechsPeriodo.length > 0 ? fechsPeriodo.reduce((a, b) => b.totalServicos > a.totalServicos ? b : a) : null;

  const contadorServicos: Record<string, { quantidade: number; total: number }> = {};
  fechsPeriodo.forEach((f) => { f.agendamentos.forEach((a) => { if (!contadorServicos[a.servico]) contadorServicos[a.servico] = { quantidade: 0, total: 0 }; contadorServicos[a.servico].quantidade++; contadorServicos[a.servico].total += parseFloat(a.preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0; }); });
  const rankServicos = Object.entries(contadorServicos).sort((a, b) => b[1].quantidade - a[1].quantidade).slice(0, 5);

  if (carregando) return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Carregando...</div>;

  const maxCat = Math.max(...Object.values(porCategoria), 1);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#F5E6C8]">Financeiro</h1>
        <p className="text-xs text-gray-500 hidden sm:block">Faturamento, gastos e lucro estimado</p>
      </div>

      {/* ── Modal de pagamento ── */}
      {pagarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setPagarModal(null); setPagarStep(1); }}>
          <div className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-sm flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
              <h3 className="font-bold text-[#F5E6C8] text-sm">Confirmar pagamento</h3>
              <button onClick={() => { setPagarModal(null); setPagarStep(1); }} className="text-gray-600 hover:text-gray-300"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              <div className="bg-[#0f0f0f] border border-[#2d2d2d] rounded-lg p-3">
                <p className="text-sm font-semibold text-[#F5E6C8]">{pagarModal.descricao}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vencimento: {new Date(pagarModal.data + "T12:00:00").toLocaleDateString("pt-BR")}
                  {pagarModal.dias < 0 && <span className="text-red-400 ml-1">· vencido há {Math.abs(pagarModal.dias)}d</span>}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">
                  Valor pago (R$) {pagarModal.dias < 0 ? "— ajuste se houve multa/juros" : ""}
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={pagarValor} onChange={(e) => { setPagarValor(e.target.value); setPagarStep(1); }}
                  className={`${inp} w-full`}
                />
                {pagarModal.valor !== Number(pagarValor) && Number(pagarValor) > 0 && (
                  <p className="text-[10px] text-amber-400">Diferença de {brl(Math.abs(Number(pagarValor) - pagarModal.valor))} em relação ao valor original</p>
                )}
              </div>
              {pagarStep === 2 && (
                <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg px-3 py-2.5">
                  <p className="text-xs font-semibold text-amber-300">Confirmar pagamento de {brl(Number(pagarValor))}?</p>
                  <p className="text-[10px] text-amber-300/60 mt-0.5">Esta ação atualizará o próximo vencimento automaticamente.</p>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-[#1e1e1e] flex gap-2">
              <button onClick={confirmarPagamento} disabled={pagando || !pagarValor || Number(pagarValor) <= 0}
                className={`flex-1 py-2.5 text-xs font-bold tracking-widest uppercase rounded-lg transition disabled:opacity-50 ${pagarStep === 2 ? "bg-green-700 text-white hover:bg-green-600" : "bg-[#b8944a] text-[#0A0A0A] hover:bg-[#c9a84c]"}`}>
                {pagando ? "Salvando..." : pagarStep === 1 ? "Confirmar pagamento" : "Sim, registrar pagamento"}
              </button>
              <button onClick={() => { setPagarModal(null); setPagarStep(1); }} className="px-4 py-2.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] transition">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alertas financeiros ── */}
      {notif.financeiro > 0 && (
        <div className="flex flex-col gap-1.5">
          {notif.caixasAbertos > 0 && (
            <div className="bg-red-950/40 border border-red-800/50 rounded-lg px-3.5 py-2.5 flex items-center gap-2 flex-wrap">
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
              <span className="text-xs font-semibold text-red-300 shrink-0">
                {notif.caixasAbertos} caixa{notif.caixasAbertos > 1 ? "s" : ""} retroativo{notif.caixasAbertos > 1 ? "s" : ""} em aberto
              </span>
              {notif.caixasAbertosLista.map((data) => (
                <Link key={data} href={`/admin/financeiro?dia=${data}#caixa`}
                  className="text-[10px] font-medium text-red-300/80 border border-red-800/40 rounded px-2 py-0.5 hover:border-red-500/60 hover:text-red-300 transition capitalize">
                  {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                </Link>
              ))}
            </div>
          )}
          {notif.vencimentos > 0 && (
            <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-amber-300">
                  {notif.vencimentos} vencimento{notif.vencimentos > 1 ? "s" : ""} próximo{notif.vencimentos > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {notif.vencimentosLista.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-2 pl-4 border-l border-amber-700/30">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-amber-300/90">{v.descricao}</p>
                      <p className="text-[10px] text-amber-300/60">
                        {v.dias === 0 ? "Vence hoje" : v.dias < 0 ? `Vencido há ${Math.abs(v.dias)}d` : `Vence em ${v.dias}d`}
                        {" · "}{new Date(v.data + "T12:00:00").toLocaleDateString("pt-BR")}
                        {" · "}{brl(v.valor)}
                      </p>
                    </div>
                    <button onClick={() => abrirPagamento(v)}
                      className="text-[10px] font-bold tracking-widest uppercase shrink-0 px-2.5 py-1 bg-amber-800/30 border border-amber-700/40 text-amber-300 rounded hover:bg-amber-800/50 transition">
                      ✓ Confirmar pagamento
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Período ── */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PERIODO_LABEL) as Periodo[]).map((p) => (
          <button key={p} onClick={() => setPeriodo(p)}
            className={`px-3 py-1 text-xs rounded-full border transition ${periodo === p ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
            {PERIODO_LABEL[p]}
          </button>
        ))}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${card} p-3.5`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-1">Faturamento</p>
          <p className="text-xl font-bold text-[#F5E6C8]">{brl(totalPeriodo)}</p>
          {varPct !== null && (
            <p className={`text-xs mt-1 ${varPct > 0 ? "text-green-400" : varPct < 0 ? "text-red-400" : "text-gray-500"}`}>
              {varPct > 0 ? "↑" : "↓"} {Math.abs(varPct).toFixed(1)}% vs anterior
            </p>
          )}
        </div>
        <div className={`${card} p-3.5`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-1">Gastos/mês</p>
          <p className="text-xl font-bold text-[#F5E6C8]">{brl(totalMensalGastos)}</p>
          <p className="text-xs text-gray-500 mt-1">{gastosAtivos.length} ativo{gastosAtivos.length !== 1 ? "s" : ""}</p>
        </div>
        <div className={`${card} p-3.5 border ${lucroEstimado >= 0 ? "border-green-800/40" : "border-red-800/40"}`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-1">Lucro estimado</p>
          <p className={`text-xl font-bold ${lucroEstimado >= 0 ? "text-green-400" : "text-red-400"}`}>{brl(lucroEstimado)}</p>
        </div>
        <div className={`${card} p-3.5`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-1">Receita total</p>
          <p className="text-xl font-bold text-[#F5E6C8]">{brl(fechamentos.reduce((s, f) => s + f.totalServicos, 0))}</p>
        </div>
      </div>

      {/* ── Gráfico ── */}
      <div className={`${card} p-4`}>
        {/* cabeçalho */}
        <div className="mb-4">
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500">Faturamento por fechamento de caixa</p>
          <p className="text-[10px] text-[#b8944a] tracking-widest uppercase mt-0.5">Receita acumulada</p>
          <p className="text-2xl font-bold text-[#F5E6C8] mt-1">{brl(totalGrafico)}</p>
          {melhorDia && periodo !== "tudo" && (
            <p className="text-xs text-gray-500 mt-0.5">
              Melhor dia: {new Date(melhorDia.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short", day: "2-digit" })} · {brl(melhorDia.totalServicos)}
            </p>
          )}
          {totalGastosGrafico > 0 && (
            <p className="text-xs text-red-400/70 mt-0.5">Gastos registrados: {brl(totalGastosGrafico)}</p>
          )}
        </div>

        {dadosGrafico.length === 0 ? (
          <p className="text-sm text-gray-500 py-12 text-center">Nenhum fechamento de caixa no período.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="data" tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`} width={46} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #2d2d2d", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#F5E6C8", marginBottom: 4 }}
                  formatter={(v, name) => [brl(Number(v)), name === "fat" ? "Faturamento" : name === "lucro" ? "Lucro acumulado" : "Gastos"]}
                />
                <Area type="monotone" dataKey="fat" stroke="#C9A84C" strokeWidth={2} fill="url(#gradFin)" dot={false} activeDot={{ r: 4, fill: "#C9A84C" }} />
                <Area type="monotone" dataKey="lucro" stroke="#22c55e" strokeWidth={1.5} fill="url(#gradLucro)" dot={false} activeDot={{ r: 3, fill: "#22c55e" }} />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={1.5} fill="url(#gradGastos)" dot={false} activeDot={{ r: 3, fill: "#ef4444" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* legenda */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-[#1a1a1a] flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-0.5 bg-[#C9A84C] rounded-full inline-block" /> Faturamento
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-0.5 bg-green-500 rounded-full inline-block" /> Lucro acumulado
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-0.5 bg-red-500 rounded-full inline-block" /> Gastos do dia
          </div>
        </div>
      </div>

      {/* ── Serviços no período ── */}
      {rankServicos.length > 0 && (
        <div className={`${card} p-4`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-3">Serviços no período</p>
          <div className="flex flex-col gap-2.5">
            {rankServicos.map(([servico, dados], idx) => {
              const pct = (dados.quantidade / rankServicos[0][1].quantidade) * 100;
              return (
                <div key={servico} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-4">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-0.5"><span className="font-medium text-[#F5E6C8]">{servico}</span><span className="text-gray-500">{dados.quantidade}x · {brl(dados.total)}</span></div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full bg-[#b8944a] rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Agenda / Caixa ── */}
      <div id="caixa">
        <CaixaCalendario fechamentos={fechamentos} gastosDia={gastosDia} avulsos={avulsos} onAtualizar={carregar} />
      </div>

      {/* ── Gráfico de pizza + Fechamentos ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${card} p-4 flex flex-col`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-3">Gastos por categoria</p>
          {donutData.length === 0 ? <p className="text-sm text-gray-500 py-10 text-center">Nenhum gasto ativo.</p> : (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ outline: "none" }}>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      strokeWidth={0}
                    >
                      {donutData.map((entry, i) => <Cell key={i} fill={corPorCategoria[entry.name] ?? DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #2d2d2d", borderRadius: 6, fontSize: 12 }} formatter={(v) => [brl(Number(v)), "Gasto/mês"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                {donutData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: corPorCategoria[entry.name] ?? DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-[11px] text-gray-500">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={`${card} p-4 flex flex-col`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-3">Fechamentos de caixa</p>
          {fechsPeriodo.length === 0 ? <p className="text-sm text-gray-500 py-10 text-center">Nenhum fechamento no período.</p> : (
            <>
              <div className="flex flex-col divide-y divide-[#1a1a1a] overflow-y-auto max-h-64 flex-1">
                {[...fechsPeriodo].reverse().map((f) => {
                  const expandido = fechExpandido === f.id;
                  return (
                    <div key={f.id}>
                      <button
                        onClick={() => setFechExpandido(expandido ? null : f.id)}
                        className="w-full flex items-center justify-between py-2.5 text-left hover:bg-[#0f0f0f] px-1 rounded transition"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#F5E6C8] capitalize">
                            {new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                          <p className="text-xs text-gray-500">{f.quantidadeAtendidos} serviço{f.quantidadeAtendidos !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-[#b8944a]">{brl(f.totalServicos)}</span>
                          <ChevronDown size={13} className={`text-gray-600 transition-transform ${expandido ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {expandido && (
                        <div className="px-1 pb-2.5">
                          <Link
                            href={`/admin/financeiro?dia=${f.data}#caixa`}
                            className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-gray-500 hover:text-[#b8944a] border border-[#2d2d2d] hover:border-[#b8944a]/40 rounded px-2.5 py-1.5 transition"
                          >
                            <CalendarDays size={11} />
                            Ver na agenda
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a] mt-1 shrink-0">
                <span className="text-xs font-semibold text-gray-400">Total</span>
                <span className="text-sm font-bold text-[#F5E6C8]">{brl(totalPeriodo)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modais de gasto ── */}
      {modalCategorias && (
        <ModalCategorias categorias={categorias} onFechar={() => setModalCategorias(false)} onChanged={carregar} />
      )}
      {(mostraFormGasto || editandoGasto) && (
        <FormGasto
          inicial={editandoGasto ?? undefined}
          categorias={categorias}
          onSalvar={salvarGasto}
          onCancelar={() => { setMostraFormGasto(false); setEditandoGasto(null); }}
          salvando={salvandoGasto}
        />
      )}

      {/* ── Gastos da empresa ── */}
      <div className={`${card} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#F5E6C8]">Gastos da empresa</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setModalCategorias(true)} title="Gerenciar categorias"
              className="p-1.5 text-gray-500 hover:text-gray-300 border border-[#2d2d2d] rounded hover:border-[#444] transition">
              <Settings size={13} />
            </button>
            <button onClick={() => { setEditandoGasto(null); setMostraFormGasto(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold rounded hover:bg-[#c9a84c] transition">
              <Plus size={13} /> Novo gasto
            </button>
          </div>
        </div>

        {gastos.length === 0 ? (
          <div className="py-8 text-center"><Receipt size={24} className="text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">Nenhum gasto cadastrado.</p></div>
        ) : (
          <div className="flex flex-col divide-y divide-[#1a1a1a] overflow-y-auto max-h-80">
            {gastos.map((g) => {
              const catCustom = g.categoriaId ? categorias.find((c) => c.id === g.categoriaId) : null;
              const catNome = catCustom?.nome ?? CATEGORIA_LABEL[g.categoria] ?? "Outros";
              const catCor = catCustom?.cor ?? "#6B7280";
              const diasParaVencer = g.proximoVencimento
                ? Math.ceil((new Date(g.proximoVencimento).getTime() - Date.now()) / 86400000)
                : null;
              const vencendoBreve = diasParaVencer !== null && diasParaVencer <= 10 && diasParaVencer >= 0;
              return (
                <div key={g.id} className={`flex items-center gap-3 py-3 ${!g.ativo ? "opacity-50" : ""}`}>
                  <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: catCor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#F5E6C8] text-sm">{g.descricao}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ color: catCor, borderColor: `${catCor}40` }}>{catNome}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-blue-900/20 text-blue-400 rounded-full">{FREQUENCIA_LABEL[g.frequencia]}</span>
                      {g.lembrarRenovacao && <Bell size={11} className="text-[#b8944a]/60" />}
                      {!g.ativo && <span className="text-xs px-1.5 py-0.5 bg-[#1a1a1a] text-gray-600 rounded-full">inativo</span>}
                    </div>
                    {g.proximoVencimento && (
                      <p className={`text-xs mt-0.5 ${vencendoBreve ? "text-amber-400" : "text-gray-500"}`}>
                        Vence em {new Date(g.proximoVencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                        {vencendoBreve && ` · ${diasParaVencer === 0 ? "hoje!" : `${diasParaVencer}d`}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-red-400 text-sm">{brl(g.valor)}</p>
                    {g.frequencia !== "mensal" && g.frequencia !== "unico" && g.ativo && <p className="text-xs text-gray-500">{brl(gastoMensalEquivalente(g))}/mês</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleGasto(g)} className={`p-1.5 rounded transition ${g.ativo ? "text-green-400 hover:text-green-300" : "text-gray-600 hover:text-gray-400"}`}>{g.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}</button>
                    <button onClick={() => { setMostraFormGasto(false); setEditandoGasto(g); }} className="p-1.5 text-gray-500 hover:text-gray-300 rounded transition"><Edit2 size={13} /></button>
                    <button onClick={() => excluirGasto(g.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded transition"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Últimos gastos (gastos do dia — 30 dias) ── */}
      {(() => {
        const limite = new Date(); limite.setDate(limite.getDate() - 30);
        const recentes = [...gastosDia]
          .filter((g) => new Date(g.data + "T12:00:00") >= limite)
          .sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm - a.criadoEm);
        if (recentes.length === 0) return null;
        return (
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#F5E6C8]">Últimos gastos</p>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">Últimos 30 dias</p>
            </div>
            <div className="flex flex-col divide-y divide-[#1a1a1a] overflow-y-auto max-h-72">
              {recentes.map((g) => {
                const expandido = gastoExpandido === g.id;
                return (
                  <div key={g.id}>
                    <button
                      onClick={() => setGastoExpandido(expandido ? null : g.id)}
                      className="w-full flex items-center justify-between py-2.5 gap-3 text-left hover:bg-[#0f0f0f] px-1 rounded transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-[#F5E6C8] truncate">{g.descricao}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(g.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-red-400">−{brl(g.valor)}</span>
                        <ChevronDown size={13} className={`text-gray-600 transition-transform ${expandido ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {expandido && (
                      <div className="px-1 pb-2.5">
                        <Link
                          href={`/admin/financeiro?dia=${g.data}#caixa`}
                          className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-gray-500 hover:text-[#b8944a] border border-[#2d2d2d] hover:border-[#b8944a]/40 rounded px-2.5 py-1.5 transition"
                        >
                          <CalendarDays size={11} />
                          Ver na agenda
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
