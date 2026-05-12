"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import {
  Receipt, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { FechamentoDia } from "@/lib/agendamentos-types";
import type { Gasto, CategoriaGasto, FrequenciaGasto } from "@/lib/gastos-tipos";
import type { GastoDia } from "@/lib/gastos-dia-tipos";
import CaixaCalendario from "@/components/admin/CaixaCalendario";
import { CATEGORIA_LABEL, FREQUENCIA_LABEL, gastoMensalEquivalente } from "@/lib/gastos-tipos";

function brl(v: number) { return `R$ ${v.toFixed(2).replace(".", ",")}` }
const card = "bg-[#111] border border-[#2d2d2d] rounded-lg";
const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-1.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

type Periodo = "7d" | "30d" | "mes_atual" | "mes_anterior";
const PERIODO_LABEL: Record<Periodo, string> = { "7d": "Últimos 7 dias", "30d": "Últimos 30 dias", "mes_atual": "Este mês", "mes_anterior": "Mês anterior" };
const DONUT_COLORS = ["#C9A84C", "#a07830", "#6b5020", "#8b6914", "#d4b060", "#e8c878"];

type PeriodoGrafico = "mes" | "6m" | "12m" | "tudo";
const PERIODO_GRAFICO_LABEL: Record<PeriodoGrafico, string> = { mes: "Este mês", "6m": "6 meses", "12m": "12 meses", tudo: "Todo período" };

interface PontoGrafico { data: string; fat: number; gastos: number }

function mesLabel(y: number, m: number) {
  const l = new Date(y, m, 1).toLocaleDateString("pt-BR", { month: "short" });
  return l.charAt(0).toUpperCase() + l.slice(1, 3);
}

function calcDadosGrafico(
  pg: PeriodoGrafico,
  fechamentos: FechamentoDia[],
  gastosDia: GastoDia[],
): PontoGrafico[] {
  const agora = new Date();

  const fatPorData: Record<string, number> = {};
  fechamentos.forEach((f) => { fatPorData[f.data] = f.totalServicos; });

  const gastosPorData: Record<string, number> = {};
  gastosDia.forEach((g) => { gastosPorData[g.data] = (gastosPorData[g.data] ?? 0) + g.valor; });

  if (pg === "mes") {
    // Apenas dias com movimento — faturamento ACUMULADO, gastos do dia
    const y = agora.getFullYear(), m = agora.getMonth(), hoje = agora.getDate();
    let acum = 0;
    const pontos: PontoGrafico[] = [];
    for (let d = 1; d <= hoje; d++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const fat = fatPorData[key] ?? 0;
      const gastos = gastosPorData[key] ?? 0;
      acum += fat;
      if (fat > 0 || gastos > 0) {
        pontos.push({
          data: new Date(y, m, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          fat: acum,
          gastos,
        });
      }
    }
    return pontos;
  }

  // Determina início do período
  let inicioY = agora.getFullYear(), inicioM = agora.getMonth();
  if (pg === "6m") {
    const d = new Date(agora.getFullYear(), agora.getMonth() - 5, 1);
    inicioY = d.getFullYear(); inicioM = d.getMonth();
  } else if (pg === "12m") {
    const d = new Date(agora.getFullYear(), agora.getMonth() - 11, 1);
    inicioY = d.getFullYear(); inicioM = d.getMonth();
  } else {
    const todasDatas = [...fechamentos.map((f) => f.data), ...gastosDia.map((g) => g.data)];
    if (todasDatas.length === 0) return [];
    const antiga = todasDatas.sort()[0];
    inicioY = Number(antiga.slice(0, 4));
    inicioM = Number(antiga.slice(5, 7)) - 1;
  }

  // Agrega por mês
  const fatPorMes: Record<string, number> = {};
  fechamentos.forEach((f) => { const k = f.data.slice(0, 7); fatPorMes[k] = (fatPorMes[k] ?? 0) + f.totalServicos; });
  const gastosPorMes: Record<string, number> = {};
  gastosDia.forEach((g) => { const k = g.data.slice(0, 7); gastosPorMes[k] = (gastosPorMes[k] ?? 0) + g.valor; });

  // Gera meses com movimento — faturamento ACUMULADO e gastos do mês
  const pontos: PontoGrafico[] = [];
  let cy = inicioY, cm = inicioM, acum = 0;
  const fimY = agora.getFullYear(), fimM = agora.getMonth();
  while (cy < fimY || (cy === fimY && cm <= fimM)) {
    const key = `${cy}-${String(cm + 1).padStart(2, "0")}`;
    const fat = fatPorMes[key] ?? 0;
    const gastos = gastosPorMes[key] ?? 0;
    acum += fat;
    if (fat > 0 || gastos > 0) {
      pontos.push({ data: mesLabel(cy, cm), fat: acum, gastos });
    }
    cm++; if (cm > 11) { cm = 0; cy++; }
  }
  return pontos;
}

function FormGasto({ inicial, onSalvar, onCancelar, salvando }: {
  inicial?: Partial<Gasto>; onSalvar: (d: Partial<Gasto>) => void;
  onCancelar: () => void; salvando: boolean;
}) {
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [categoria, setCategoria] = useState<CategoriaGasto>(inicial?.categoria ?? "outros");
  const [valor, setValor] = useState(String(inicial?.valor ?? ""));
  const [frequencia, setFrequencia] = useState<FrequenciaGasto>(inicial?.frequencia ?? "mensal");
  const [ativo, setAtivo] = useState(inicial?.ativo ?? true);
  const [vencimento, setVencimento] = useState(String(inicial?.vencimento ?? ""));
  const [erro, setErro] = useState("");

  function submit() {
    if (!descricao.trim()) { setErro("Descrição obrigatória"); return; }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro("Valor inválido"); return; }
    setErro("");
    onSalvar({ descricao, categoria, valor: Number(valor), frequencia, ativo, vencimento: vencimento ? Number(vencimento) : null });
  }

  return (
    <div className={`${card} p-5 flex flex-col gap-4`}>
      <h4 className="font-semibold text-[#F5E6C8] text-sm">{inicial?.id ? "Editar gasto" : "Novo gasto recorrente"}</h4>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">Descrição *</label><input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="ex: Aluguel do espaço" className={inp} /></div>
        <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">Categoria *</label><select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaGasto)} className={inp}>{(Object.keys(CATEGORIA_LABEL) as CategoriaGasto[]).map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">Valor (R$) *</label><input type="number" min="0" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={inp} /></div>
        <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">Frequência *</label><select value={frequencia} onChange={(e) => setFrequencia(e.target.value as FrequenciaGasto)} className={inp}>{(Object.keys(FREQUENCIA_LABEL) as FrequenciaGasto[]).map((f) => <option key={f} value={f}>{FREQUENCIA_LABEL[f]}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">Dia de vencimento</label><input type="number" min="1" max="31" value={vencimento} onChange={(e) => setVencimento(e.target.value)} placeholder="ex: 5" className={inp} /></div>
        <div className="flex flex-col gap-1 justify-end"><label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer pb-1"><input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="accent-[#b8944a]" /> Ativo</label></div>
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={salvando} className="px-4 py-1.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50">{salvando ? "Salvando..." : "Salvar"}</button>
        <button onClick={onCancelar} className="px-4 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] transition">Cancelar</button>
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [gastosDia, setGastosDia] = useState<GastoDia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("mes_atual");
  const [mostraFormGasto, setMostraFormGasto] = useState(false);
  const [editandoGasto, setEditandoGasto] = useState<Gasto | null>(null);
  const [salvandoGasto, setSalvandoGasto] = useState(false);
  const [periodoGrafico, setPeriodoGrafico] = useState<PeriodoGrafico>("mes");

  const carregar = useCallback(async () => {
    const [resFech, resGastos, resGastosDia] = await Promise.all([
      fetch("/api/fechamento", { credentials: "include" }),
      fetch("/api/gastos", { credentials: "include" }),
      fetch("/api/gastos-dia", { credentials: "include" }),
    ]);
    setFechamentos(await resFech.json());
    if (resGastos.ok) setGastos(await resGastos.json());
    if (resGastosDia.ok) setGastosDia(await resGastosDia.json());
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

  const dadosGrafico = calcDadosGrafico(periodoGrafico, fechamentos, gastosDia);
  const totalGrafico = dadosGrafico.reduce((s, d) => s + d.fat, 0);
  const totalGastosGrafico = dadosGrafico.reduce((s, d) => s + d.gastos, 0);

  const gastosAtivos = gastos.filter((g) => g.ativo);
  const totalMensalGastos = gastosAtivos.reduce((s, g) => s + gastoMensalEquivalente(g), 0);
  const lucroEstimado = totalPeriodo - totalMensalGastos;

  const porCategoria: Record<string, number> = {};
  gastosAtivos.forEach((g) => { const cat = CATEGORIA_LABEL[g.categoria]; porCategoria[cat] = (porCategoria[cat] ?? 0) + gastoMensalEquivalente(g); });
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
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500">Faturamento por fechamento de caixa</p>
            <p className="text-[10px] text-[#b8944a] tracking-widest uppercase mt-0.5">Receita acumulada</p>
            <p className="text-2xl font-bold text-[#F5E6C8] mt-1">{brl(totalGrafico)}</p>
            {melhorDia && periodoGrafico === "mes" && (
              <p className="text-xs text-gray-500 mt-0.5">
                Melhor dia: {new Date(melhorDia.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short", day: "2-digit" })} · {brl(melhorDia.totalServicos)}
              </p>
            )}
            {totalGastosGrafico > 0 && (
              <p className="text-xs text-red-400/70 mt-0.5">Gastos registrados: {brl(totalGastosGrafico)}</p>
            )}
          </div>
          {/* seletor de período */}
          <div className="flex gap-1 flex-wrap">
            {(Object.keys(PERIODO_GRAFICO_LABEL) as PeriodoGrafico[]).map((p) => (
              <button key={p} onClick={() => setPeriodoGrafico(p)}
                className={`px-3 py-1 text-xs rounded border transition ${periodoGrafico === p ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-500 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
                {PERIODO_GRAFICO_LABEL[p]}
              </button>
            ))}
          </div>
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
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="data" tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`} width={46} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #2d2d2d", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#F5E6C8", marginBottom: 4 }}
                  formatter={(v, name) => [brl(Number(v)), name === "fat" ? "Faturamento" : "Gastos"]}
                />
                <Area type="monotone" dataKey="fat" stroke="#C9A84C" strokeWidth={2} fill="url(#gradFin)" dot={false} activeDot={{ r: 4, fill: "#C9A84C" }} />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={1.5} fill="url(#gradGastos)" dot={false} activeDot={{ r: 3, fill: "#ef4444" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* legenda */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-0.5 bg-[#C9A84C] rounded-full inline-block" /> Faturamento
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-0.5 bg-red-500 rounded-full inline-block" /> Gastos do dia
          </div>
        </div>
      </div>

      {/* ── Agenda / Caixa ── */}
      <CaixaCalendario fechamentos={fechamentos} gastosDia={gastosDia} onAtualizar={carregar} />

      {/* ── Gráfico de pizza + Fechamentos ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${card} p-4`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-3">Gastos por categoria</p>
          {donutData.length === 0 ? <p className="text-sm text-gray-500 py-10 text-center">Nenhum gasto ativo.</p> : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                    {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid #2d2d2d", borderRadius: 6, fontSize: 12 }} formatter={(v) => [brl(Number(v)), "Gasto/mês"]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#888" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className={`${card} p-4`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-3">Fechamentos de caixa</p>
          {fechsPeriodo.length === 0 ? <p className="text-sm text-gray-500 py-10 text-center">Nenhum fechamento no período.</p> : (
            <div className="flex flex-col divide-y divide-[#1a1a1a]">
              {[...fechsPeriodo].reverse().map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-[#F5E6C8] capitalize">{new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}</p>
                    <p className="text-xs text-gray-500">{f.quantidadeAtendidos} serviço{f.quantidadeAtendidos !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-sm font-bold text-[#b8944a]">{brl(f.totalServicos)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2"><span className="text-xs font-semibold text-gray-400">Total</span><span className="text-sm font-bold text-[#F5E6C8]">{brl(totalPeriodo)}</span></div>
            </div>
          )}
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

      {/* ── Divisor ── */}
      <div className="border-t border-[#2d2d2d] pt-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Gastos recorrentes</p>
      </div>

      {/* ── Gastos por categoria barra ── */}
      {Object.keys(porCategoria).length > 0 && (
        <div className={`${card} p-4`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-3">Por categoria</p>
          <div className="flex flex-col gap-2.5">
            {Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 shrink-0">{cat}</span>
                <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full bg-red-500/60 rounded-full" style={{ width: `${(val / maxCat) * 100}%` }} /></div>
                <span className="text-xs font-medium text-gray-400 w-20 text-right shrink-0">{brl(val)}/mês</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lista de gastos ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#F5E6C8]">Todos os gastos</p>
        <button onClick={() => { setEditandoGasto(null); setMostraFormGasto(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold rounded hover:bg-[#c9a84c] transition"><Plus size={13} /> Novo gasto</button>
      </div>
      {mostraFormGasto && !editandoGasto && <FormGasto onSalvar={salvarGasto} onCancelar={() => setMostraFormGasto(false)} salvando={salvandoGasto} />}
      {editandoGasto && <FormGasto inicial={editandoGasto} onSalvar={salvarGasto} onCancelar={() => setEditandoGasto(null)} salvando={salvandoGasto} />}

      {gastos.length === 0 ? (
        <div className={`${card} p-10 text-center`}><Receipt size={24} className="text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">Nenhum gasto cadastrado.</p></div>
      ) : (
        <div className="flex flex-col gap-2">
          {gastos.map((g) => (
            <div key={g.id} className={`${card} p-3.5 flex items-center gap-3 ${!g.ativo ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#F5E6C8] text-sm">{g.descricao}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-[#1a1a1a] text-gray-400 rounded-full">{CATEGORIA_LABEL[g.categoria]}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-blue-900/20 text-blue-400 rounded-full">{FREQUENCIA_LABEL[g.frequencia]}</span>
                  {!g.ativo && <span className="text-xs px-1.5 py-0.5 bg-[#1a1a1a] text-gray-600 rounded-full">inativo</span>}
                </div>
                {g.vencimento && <p className="text-xs text-gray-500 mt-0.5">Vence dia {g.vencimento}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-red-400 text-sm">{brl(g.valor)}</p>
                {g.frequencia !== "mensal" && g.ativo && <p className="text-xs text-gray-500">{brl(gastoMensalEquivalente(g))}/mês</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleGasto(g)} className={`p-1.5 rounded transition ${g.ativo ? "text-green-400 hover:text-green-300" : "text-gray-600 hover:text-gray-400"}`}>{g.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}</button>
                <button onClick={() => { setMostraFormGasto(false); setEditandoGasto(g); }} className="p-1.5 text-gray-500 hover:text-gray-300 rounded transition"><Edit2 size={13} /></button>
                <button onClick={() => excluirGasto(g.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded transition"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
