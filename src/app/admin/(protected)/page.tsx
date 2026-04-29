"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, Scissors, Users, DollarSign,
  ChevronLeft, ChevronRight, CalendarCheck, BarChart2,
  Lock, ArrowUpRight, ArrowDownRight, Minus,
  Receipt, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import type { Agendamento, FechamentoDia } from "@/lib/agendamentos";
import type { Gasto, CategoriaGasto, FrequenciaGasto } from "@/lib/gastos-tipos";
import { CATEGORIA_LABEL, FREQUENCIA_LABEL, gastoMensalEquivalente } from "@/lib/gastos-tipos";

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parsePriceNum(preco: string) {
  return parseFloat(preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
}

function brl(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DIAS_SEMANA_MINI = ["D","S","T","Q","Q","S","S"];

type Periodo = "7d" | "30d" | "mes_atual" | "mes_anterior";
const PERIODO_LABEL: Record<Periodo, string> = { "7d": "Últimos 7 dias", "30d": "Últimos 30 dias", "mes_atual": "Este mês", "mes_anterior": "Mês anterior" };

const card = "bg-[#111] border border-[#2d2d2d] rounded-lg";
const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-1.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

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

export default function AdminDashboard() {
  const hoje = new Date();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mesCalendario, setMesCalendario] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [aba, setAba] = useState<"overview" | "financeiro" | "gastos">("overview");
  const [periodo, setPeriodo] = useState<Periodo>("mes_atual");
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [mostraFormGasto, setMostraFormGasto] = useState(false);
  const [editandoGasto, setEditandoGasto] = useState<Gasto | null>(null);
  const [salvandoGasto, setSalvandoGasto] = useState(false);

  const carregar = useCallback(async () => {
    const [resAgs, resFech, resGastos] = await Promise.all([
      fetch("/api/agendamentos", { credentials: "include" }),
      fetch("/api/fechamento", { credentials: "include" }),
      fetch("/api/gastos", { credentials: "include" }),
    ]);
    setAgendamentos(await resAgs.json());
    setFechamentos(await resFech.json());
    if (resGastos.ok) setGastos(await resGastos.json());
    setCarregando(false);
  }, []);

  async function salvarGasto(data: Partial<Gasto>) {
    setSalvandoGasto(true);
    if (editandoGasto) {
      await fetch(`/api/gastos/${editandoGasto.id}`, { credentials: "include",  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setEditandoGasto(null);
    } else {
      await fetch("/api/gastos", { credentials: "include",  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setMostraFormGasto(false);
    }
    setSalvandoGasto(false);
    carregar();
  }

  async function toggleGasto(g: Gasto) {
    await fetch(`/api/gastos/${g.id}`, { credentials: "include",  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !g.ativo }) });
    carregar();
  }

  async function excluirGasto(id: string) {
    if (!confirm("Excluir este gasto?")) return;
    await fetch(`/api/gastos/${id}`, { credentials: "include",  method: "DELETE" });
    carregar();
  }

  useEffect(() => { carregar(); }, [carregar]);

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

  const mesAtual = hoje.getMonth(); const anoAtual = hoje.getFullYear();
  const fechamentosMes = fechamentos.filter((f) => { const d = new Date(f.data + "T12:00:00"); return d.getMonth() === mesAtual && d.getFullYear() === anoAtual; });
  const faturamentoMes = fechamentosMes.reduce((s, f) => s + f.totalServicos, 0);
  const servicosMes = fechamentosMes.reduce((s, f) => s + f.quantidadeAtendidos, 0);
  const ticketMedio = servicosMes > 0 ? faturamentoMes / servicosMes : 0;
  const agendamentosHoje = agendamentos.filter((a) => a.data === toDateKey(hoje));
  const pendentesHoje = agendamentosHoje.filter((a) => a.status === "pendente" || a.status === "confirmado").length;

  const kpis = [
    { label: "Faturamento do mês", value: brl(faturamentoMes), icon: DollarSign, cor: "text-[#b8944a]", bg: "bg-[#b8944a]/10" },
    { label: "Serviços realizados", value: servicosMes, icon: Scissors, cor: "text-blue-400", bg: "bg-blue-900/20" },
    { label: "Ticket médio", value: brl(ticketMedio), icon: TrendingUp, cor: "text-green-400", bg: "bg-green-900/20" },
    { label: "Agendamentos hoje", value: pendentesHoje, icon: Users, cor: "text-purple-400", bg: "bg-purple-900/20" },
  ];

  const ano = mesCalendario.getFullYear(); const mes = mesCalendario.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const celulas: Array<{ dia: number; atual: boolean }> = [];
  for (let i = 0; i < primeiroDia; i++) celulas.push({ dia: 0, atual: false });
  for (let d = 1; d <= ultimoDia; d++) celulas.push({ dia: d, atual: true });
  while (celulas.length % 7 !== 0) celulas.push({ dia: 0, atual: false });

  function contarAgsDia(dia: number) {
    const key = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return agendamentos.filter((a) => a.data === key && a.status !== "cancelado").length;
  }

  const fechsPeriodo = getFechamentosPeriodo(periodo).sort((a, b) => a.data.localeCompare(b.data));
  const totalPeriodo = fechsPeriodo.reduce((s, f) => s + f.totalServicos, 0);
  const servicosPeriodo = fechsPeriodo.reduce((s, f) => s + f.quantidadeAtendidos, 0);
  const ticketPeriodo = servicosPeriodo > 0 ? totalPeriodo / servicosPeriodo : 0;
  const maxFatPeriodo = Math.max(...fechsPeriodo.map((f) => f.totalServicos), 1);

  const fechsAnt = (() => {
    const agora = new Date();
    if (periodo === "mes_atual") { const m = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1; const y = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear(); return fechamentos.filter((f) => { const d = new Date(f.data + "T12:00:00"); return d.getMonth() === m && d.getFullYear() === y; }); }
    if (periodo === "7d") { const fim = new Date(agora); fim.setDate(fim.getDate() - 7); const ini = new Date(agora); ini.setDate(ini.getDate() - 14); return fechamentos.filter((f) => { const d = new Date(f.data + "T12:00:00"); return d >= ini && d < fim; }); }
    return [];
  })();
  const totalAnt = fechsAnt.reduce((s, f) => s + f.totalServicos, 0);
  const varPct = totalAnt > 0 ? ((totalPeriodo - totalAnt) / totalAnt) * 100 : null;

  const contadorServicos: Record<string, { quantidade: number; total: number }> = {};
  fechsPeriodo.forEach((f) => { f.agendamentos.forEach((a) => { if (!contadorServicos[a.servico]) contadorServicos[a.servico] = { quantidade: 0, total: 0 }; contadorServicos[a.servico].quantidade++; contadorServicos[a.servico].total += parsePriceNum(a.preco); }); });
  const rankServicos = Object.entries(contadorServicos).sort((a, b) => b[1].quantidade - a[1].quantidade).slice(0, 5);

  const contadorOverview: Record<string, { quantidade: number; total: number }> = {};
  fechamentos.forEach((f) => { f.agendamentos.forEach((a) => { if (!contadorOverview[a.servico]) contadorOverview[a.servico] = { quantidade: 0, total: 0 }; contadorOverview[a.servico].quantidade++; contadorOverview[a.servico].total += parsePriceNum(a.preco); }); });
  const rankOverview = Object.entries(contadorOverview).sort((a, b) => b[1].quantidade - a[1].quantidade).slice(0, 5);

  if (carregando) {
    return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Carregando dashboard...</div>;
  }

  const abaBtn = (id: typeof aba, label: string, Icon: React.ComponentType<{ size?: number }>) => (
    <button onClick={() => setAba(id)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition ${aba === id ? "bg-[#1a1a1a] text-[#b8944a]" : "text-gray-500 hover:text-gray-300"}`}>
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Painel</h1>
        <span className="text-sm text-gray-500 capitalize">{hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>

      {/* abas */}
      <div className={`flex gap-1 ${card} p-1 w-fit`}>
        {abaBtn("overview", "Overview", CalendarCheck)}
        {abaBtn("financeiro", "Financeiro", BarChart2)}
        {abaBtn("gastos", "Gastos", Receipt)}
      </div>

      {/* ═══ OVERVIEW ════════════════════════════════════════════════════════ */}
      {aba === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className={`${card} p-5 flex flex-col gap-3`}>
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center ${k.cor}`}><k.icon size={18} /></div>
                <div><p className="text-xs text-gray-500 mb-0.5">{k.label}</p><p className="text-2xl font-bold text-[#F5E6C8]">{k.value}</p></div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* calendário */}
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#F5E6C8] flex items-center gap-2"><CalendarCheck size={16} className="text-[#b8944a]" /> Agendamentos</h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMesCalendario(new Date(ano, mes - 1, 1))} className="p-1 text-gray-500 hover:text-[#b8944a] transition"><ChevronLeft size={16} /></button>
                  <span className="text-xs font-medium text-gray-400 w-20 text-center">{MESES[mes]} {ano}</span>
                  <button onClick={() => setMesCalendario(new Date(ano, mes + 1, 1))} className="p-1 text-gray-500 hover:text-[#b8944a] transition"><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA_MINI.map((d, i) => <div key={i} className={`text-center text-xs py-1 ${i === 0 ? "text-red-500" : "text-gray-600"}`}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {celulas.map((cell, i) => {
                  if (!cell.atual || cell.dia === 0) return <div key={i} className="h-9" />;
                  const count = contarAgsDia(cell.dia);
                  const key = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(cell.dia).padStart(2, "0")}`;
                  const eHoje = key === toDateKey(hoje);
                  return (
                    <Link key={i} href={`/admin/agendamentos?data=${key}`}
                      className={`h-9 flex flex-col items-center justify-center rounded text-xs transition hover:bg-[#b8944a]/10 ${eHoje ? "bg-[#b8944a] text-[#0A0A0A]" : "text-gray-300"}`}>
                      <span className={eHoje ? "font-bold" : ""}>{cell.dia}</span>
                      {count > 0 && <span className={`text-[9px] font-medium ${eHoje ? "text-[#0A0A0A]" : "text-[#b8944a]"}`}>{count}</span>}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center justify-between text-xs text-gray-500">
                <span>Números = qtd. de agendamentos</span>
                <Link href="/admin/agendamentos" className="text-[#b8944a] hover:underline">Ver todos →</Link>
              </div>
            </div>

            {/* ranking */}
            <div className={`${card} p-5`}>
              <h2 className="font-semibold text-[#F5E6C8] flex items-center gap-2 mb-4"><Scissors size={16} className="text-[#b8944a]" /> Serviços mais realizados</h2>
              {rankOverview.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">Nenhum serviço concluído ainda.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {rankOverview.map(([servico, dados], idx) => {
                    const pct = (dados.quantidade / rankOverview[0][1].quantidade) * 100;
                    return (
                      <div key={servico} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-4">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="font-medium text-[#F5E6C8]">{servico}</span>
                            <span className="text-gray-500">{dados.quantidade}x · {brl(dados.total)}</span>
                          </div>
                          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full bg-[#b8944a] rounded-full" style={{ width: `${pct}%` }} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {agendamentosHoje.length > 0 && (
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#F5E6C8]">Agenda de hoje</h2>
                <Link href="/admin/agendamentos" className="text-xs text-[#b8944a] hover:underline">Gerenciar →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {agendamentosHoje.sort((a, b) => a.horario.localeCompare(b.horario)).map((ag) => (
                  <div key={ag.id} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 font-mono w-12">{ag.horario}</span>
                    <span className="font-medium text-[#F5E6C8]">{ag.nome}</span>
                    <span className="text-gray-500 flex-1">{ag.servico}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      ag.status === "concluido" ? "bg-green-900/30 text-green-400 border-green-700/50" :
                      ag.status === "confirmado" ? "bg-blue-900/30 text-blue-400 border-blue-700/50" :
                      ag.status === "cancelado" ? "bg-red-900/30 text-red-400 border-red-700/50" :
                      "bg-yellow-900/30 text-yellow-400 border-yellow-700/50"
                    }`}>
                      {ag.status === "concluido" ? "Concluído" : ag.status === "confirmado" ? "Confirmado" : ag.status === "cancelado" ? "Cancelado" : "Pendente"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ GASTOS ══════════════════════════════════════════════════════════ */}
      {aba === "gastos" && (() => {
        const gastosAtivos = gastos.filter((g) => g.ativo);
        const totalMensal = gastosAtivos.reduce((s, g) => s + gastoMensalEquivalente(g), 0);
        const lucroEstimado = faturamentoMes - totalMensal;
        const porCategoria: Record<string, number> = {};
        gastosAtivos.forEach((g) => { const cat = CATEGORIA_LABEL[g.categoria]; porCategoria[cat] = (porCategoria[cat] ?? 0) + gastoMensalEquivalente(g); });
        const maxCat = Math.max(...Object.values(porCategoria), 1);

        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className={`${card} p-5`}>
                <div className="w-9 h-9 rounded-lg bg-red-900/20 flex items-center justify-center text-red-400 mb-3"><Receipt size={18} /></div>
                <p className="text-xs text-gray-500 mb-0.5">Gastos mensais</p>
                <p className="text-2xl font-bold text-[#F5E6C8]">{brl(totalMensal)}</p>
                <p className="text-xs text-gray-500 mt-1">{gastosAtivos.length} item{gastosAtivos.length !== 1 ? "s" : ""} ativo{gastosAtivos.length !== 1 ? "s" : ""}</p>
              </div>
              <div className={`${card} p-5`}>
                <div className="w-9 h-9 rounded-lg bg-[#b8944a]/10 flex items-center justify-center text-[#b8944a] mb-3"><DollarSign size={18} /></div>
                <p className="text-xs text-gray-500 mb-0.5">Faturamento do mês</p>
                <p className="text-2xl font-bold text-[#F5E6C8]">{brl(faturamentoMes)}</p>
              </div>
              <div className={`bg-[#111] border ${lucroEstimado >= 0 ? "border-green-800/40" : "border-red-800/40"} rounded-lg p-5 col-span-2 md:col-span-1`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${lucroEstimado >= 0 ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}><TrendingUp size={18} /></div>
                <p className="text-xs text-gray-500 mb-0.5">Lucro estimado</p>
                <p className={`text-2xl font-bold ${lucroEstimado >= 0 ? "text-green-400" : "text-red-400"}`}>{brl(lucroEstimado)}</p>
                <p className="text-xs text-gray-500 mt-1">fat. - gastos recorrentes</p>
              </div>
            </div>

            {Object.keys(porCategoria).length > 0 && (
              <div className={`${card} p-5`}>
                <h2 className="font-semibold text-[#F5E6C8] flex items-center gap-2 mb-4"><BarChart2 size={16} className="text-[#b8944a]" /> Gastos por categoria</h2>
                <div className="flex flex-col gap-3">
                  {Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24 shrink-0">{cat}</span>
                      <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full bg-red-500/60 rounded-full" style={{ width: `${(val / maxCat) * 100}%` }} /></div>
                      <span className="text-xs font-medium text-gray-400 w-24 text-right shrink-0">{brl(val)}/mês</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#F5E6C8]">Gastos recorrentes</h2>
              <button onClick={() => { setEditandoGasto(null); setMostraFormGasto(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold rounded hover:bg-[#c9a84c] transition"><Plus size={14} /> Novo gasto</button>
            </div>
            {mostraFormGasto && !editandoGasto && <FormGasto onSalvar={salvarGasto} onCancelar={() => setMostraFormGasto(false)} salvando={salvandoGasto} />}
            {editandoGasto && <FormGasto inicial={editandoGasto} onSalvar={salvarGasto} onCancelar={() => setEditandoGasto(null)} salvando={salvandoGasto} />}

            {gastos.length === 0 ? (
              <div className={`${card} p-12 text-center`}><Receipt size={28} className="text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500">Nenhum gasto cadastrado.</p></div>
            ) : (
              <div className="flex flex-col gap-2">
                {gastos.map((g) => (
                  <div key={g.id} className={`${card} p-4 flex items-center gap-3 transition ${!g.ativo ? "opacity-50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#F5E6C8] text-sm">{g.descricao}</span>
                        <span className="text-xs px-2 py-0.5 bg-[#1a1a1a] text-gray-400 rounded-full">{CATEGORIA_LABEL[g.categoria]}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-900/20 text-blue-400 rounded-full">{FREQUENCIA_LABEL[g.frequencia]}</span>
                        {!g.ativo && <span className="text-xs px-2 py-0.5 bg-[#1a1a1a] text-gray-600 rounded-full">inativo</span>}
                      </div>
                      {g.vencimento && <p className="text-xs text-gray-500 mt-0.5">Vence dia {g.vencimento}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-red-400 text-sm">{brl(g.valor)}</p>
                      {g.frequencia !== "mensal" && g.ativo && <p className="text-xs text-gray-500">{brl(gastoMensalEquivalente(g))}/mês</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleGasto(g)} className={`p-1.5 rounded transition ${g.ativo ? "text-green-400 hover:text-green-300" : "text-gray-600 hover:text-gray-400"}`}>{g.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}</button>
                      <button onClick={() => { setMostraFormGasto(false); setEditandoGasto(g); }} className="p-1.5 text-gray-500 hover:text-gray-300 rounded transition"><Edit2 size={14} /></button>
                      <button onClick={() => excluirGasto(g.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded transition"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* ═══ FINANCEIRO ══════════════════════════════════════════════════════ */}
      {aba === "financeiro" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(PERIODO_LABEL) as Periodo[]).map((p) => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 text-sm rounded-full border transition ${periodo === p ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
                {PERIODO_LABEL[p]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${card} p-5 col-span-2 md:col-span-1`}>
              <div className="w-9 h-9 rounded-lg bg-[#b8944a]/10 flex items-center justify-center text-[#b8944a] mb-3"><DollarSign size={18} /></div>
              <p className="text-xs text-gray-500 mb-0.5">Faturamento</p>
              <p className="text-2xl font-bold text-[#F5E6C8]">{brl(totalPeriodo)}</p>
              {varPct !== null && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${varPct > 0 ? "text-green-400" : varPct < 0 ? "text-red-400" : "text-gray-500"}`}>
                  {varPct > 0 ? <ArrowUpRight size={12} /> : varPct < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                  {varPct > 0 ? "+" : ""}{varPct.toFixed(1)}% vs período anterior
                </div>
              )}
            </div>
            <div className={`${card} p-5`}>
              <div className="w-9 h-9 rounded-lg bg-blue-900/20 flex items-center justify-center text-blue-400 mb-3"><Scissors size={18} /></div>
              <p className="text-xs text-gray-500 mb-0.5">Serviços</p>
              <p className="text-2xl font-bold text-[#F5E6C8]">{servicosPeriodo}</p>
              <p className="text-xs text-gray-500 mt-1">{fechsPeriodo.length} dias com caixa fechado</p>
            </div>
            <div className={`${card} p-5`}>
              <div className="w-9 h-9 rounded-lg bg-green-900/20 flex items-center justify-center text-green-400 mb-3"><TrendingUp size={18} /></div>
              <p className="text-xs text-gray-500 mb-0.5">Ticket médio</p>
              <p className="text-2xl font-bold text-[#F5E6C8]">{brl(ticketPeriodo)}</p>
            </div>
            {fechsPeriodo.length > 0 && (() => {
              const melhor = fechsPeriodo.reduce((a, b) => b.totalServicos > a.totalServicos ? b : a);
              const dataLabel = new Date(melhor.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
              return (
                <div className={`${card} p-5`}>
                  <div className="w-9 h-9 rounded-lg bg-purple-900/20 flex items-center justify-center text-purple-400 mb-3"><BarChart2 size={18} /></div>
                  <p className="text-xs text-gray-500 mb-0.5">Melhor dia</p>
                  <p className="text-2xl font-bold text-[#F5E6C8]">{dataLabel}</p>
                  <p className="text-xs text-gray-500 mt-1">{brl(melhor.totalServicos)}</p>
                </div>
              );
            })()}
          </div>

          <div className={`${card} p-5`}>
            <h2 className="font-semibold text-[#F5E6C8] flex items-center gap-2 mb-5"><TrendingUp size={16} className="text-[#b8944a]" /> Faturamento por dia</h2>
            {fechsPeriodo.length === 0 ? (
              <p className="text-sm text-gray-500 py-12 text-center">Nenhum fechamento de caixa no período selecionado.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {fechsPeriodo.map((f) => {
                  const altura = Math.max((f.totalServicos / maxFatPeriodo) * 100, 3);
                  const dataLabel = new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                  const isMelhor = f.totalServicos === maxFatPeriodo;
                  return (
                    <div key={f.id} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition">{brl(f.totalServicos)}</span>
                      <div className={`w-full rounded-t transition ${isMelhor ? "bg-[#b8944a]" : "bg-[#b8944a]/30 group-hover:bg-[#b8944a]/60"}`} style={{ height: `${altura}%` }} title={`${dataLabel} · ${brl(f.totalServicos)}`} />
                      <span className="text-[9px] text-gray-500">{dataLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className={`${card} p-5`}>
              <h2 className="font-semibold text-[#F5E6C8] flex items-center gap-2 mb-4"><Scissors size={16} className="text-[#b8944a]" /> Serviços no período</h2>
              {rankServicos.length === 0 ? <p className="text-sm text-gray-500 py-8 text-center">Nenhum serviço concluído no período.</p> : (
                <div className="flex flex-col gap-3">
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
              )}
            </div>
            <div className={`${card} p-5`}>
              <h2 className="font-semibold text-[#F5E6C8] flex items-center gap-2 mb-4"><Lock size={16} className="text-[#b8944a]" /> Fechamentos de caixa</h2>
              {fechsPeriodo.length === 0 ? <p className="text-sm text-gray-500 py-8 text-center">Nenhum fechamento no período.</p> : (
                <div className="flex flex-col divide-y divide-[#1a1a1a]">
                  {[...fechsPeriodo].reverse().map((f) => {
                    const dataLabel = new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
                    return (
                      <div key={f.id} className="flex items-center justify-between py-2.5">
                        <div><p className="text-sm font-medium text-[#F5E6C8] capitalize">{dataLabel}</p><p className="text-xs text-gray-500">{f.quantidadeAtendidos} serviço{f.quantidadeAtendidos !== 1 ? "s" : ""}</p></div>
                        <span className="text-sm font-bold text-[#b8944a]">{brl(f.totalServicos)}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-3"><span className="text-sm font-semibold text-gray-400">Total</span><span className="text-sm font-bold text-[#F5E6C8]">{brl(totalPeriodo)}</span></div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
