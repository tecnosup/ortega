"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Scissors, DollarSign, CalendarCheck, TrendingUp,
  ChevronLeft, ChevronRight, AlertTriangle, Bell,
  Clock, CreditCard, X, CheckCircle2, AlertCircle,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Agendamento, FechamentoDia } from "@/lib/agendamentos";
import type { Gasto } from "@/lib/gastos-tipos";
import { gastoMensalEquivalente } from "@/lib/gastos-tipos";

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
const card = "bg-[#111] border border-[#2d2d2d] rounded-lg";

// ── Tipos de alerta ──────────────────────────────────────────────────────────
type AlertaNivel = "vermelho" | "laranja" | "amarelo" | "azul";
interface Alerta {
  id: string;
  nivel: AlertaNivel;
  mensagem: string;
  href?: string;
}

const ALERTA_STYLES: Record<AlertaNivel, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  vermelho: { bg: "bg-red-950/60",    border: "border-red-700/50",    text: "text-red-300",    icon: <AlertCircle size={15} /> },
  laranja:  { bg: "bg-orange-950/60", border: "border-orange-600/50", text: "text-orange-300", icon: <AlertTriangle size={15} /> },
  amarelo:  { bg: "bg-yellow-950/50", border: "border-yellow-600/40", text: "text-yellow-300", icon: <Bell size={15} /> },
  azul:     { bg: "bg-blue-950/50",   border: "border-blue-600/40",   text: "text-blue-300",   icon: <CheckCircle2 size={15} /> },
};

function calcularAlertas(
  agendamentos: Agendamento[],
  gastos: Gasto[],
  fechamentos: FechamentoDia[],
): Alerta[] {
  const alertas: Alerta[] = [];
  const agora = new Date();
  const hoje = toDateKey(agora);
  const agoraMs = agora.getTime();

  // 1. Agendamentos não visualizados pelo admin
  const naoVisualizados = agendamentos.filter((a) => a.visualizadoAdmin === false && a.status !== "cancelado");
  if (naoVisualizados.length > 0) {
    alertas.push({
      id: "nao_visualizados",
      nivel: "laranja",
      mensagem: `${naoVisualizados.length} novo${naoVisualizados.length > 1 ? "s" : ""} agendamento${naoVisualizados.length > 1 ? "s" : ""} aguardando confirmação`,
      href: "/admin/agendamentos",
    });
  }

  // 2. Atendimento em menos de 30 minutos
  const proximos = agendamentos.filter((a) => {
    if (a.data !== hoje) return false;
    if (a.status === "cancelado" || a.status === "concluido") return false;
    const [h, m] = a.horario.split(":").map(Number);
    const atendimentoMs = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h, m).getTime();
    const diff = atendimentoMs - agoraMs;
    return diff > 0 && diff <= 30 * 60 * 1000;
  });
  proximos.forEach((a) => {
    const [h, m] = a.horario.split(":").map(Number);
    const atendimentoMs = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h, m).getTime();
    const mins = Math.round((atendimentoMs - agoraMs) / 60000);
    alertas.push({
      id: `proximo_${a.id}`,
      nivel: mins <= 10 ? "vermelho" : "laranja",
      mensagem: `${a.nome} — ${a.servico} em ${mins} min (${a.horario})`,
      href: "/admin/agendamentos",
    });
  });

  // 3. Atendimento em atraso (horário passou, status ainda pendente/confirmado)
  const atrasados = agendamentos.filter((a) => {
    if (a.data !== hoje) return false;
    if (a.status !== "pendente" && a.status !== "confirmado") return false;
    const [h, m] = a.horario.split(":").map(Number);
    const atendimentoMs = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h, m).getTime();
    return agoraMs > atendimentoMs + 10 * 60 * 1000; // passou 10min
  });
  if (atrasados.length > 0) {
    alertas.push({
      id: "atrasados",
      nivel: "vermelho",
      mensagem: `${atrasados.length} atendimento${atrasados.length > 1 ? "s" : ""} com horário passado sem conclusão`,
      href: "/admin/agendamentos",
    });
  }

  // 4. Gastos vencendo
  const diaHoje = agora.getDate();
  gastos.filter((g) => g.ativo && g.vencimento !== null).forEach((g) => {
    const diasRestantes = (g.vencimento! - diaHoje);
    if (diasRestantes < 0) {
      alertas.push({ id: `gasto_vencido_${g.id}`, nivel: "vermelho", mensagem: `Conta "${g.descricao}" está vencida (dia ${g.vencimento})`, href: "/admin/financeiro" });
    } else if (diasRestantes === 0) {
      alertas.push({ id: `gasto_hoje_${g.id}`, nivel: "laranja", mensagem: `Conta "${g.descricao}" vence hoje — ${brl(g.valor)}`, href: "/admin/financeiro" });
    } else if (diasRestantes <= 3) {
      alertas.push({ id: `gasto_em_${g.id}`, nivel: "amarelo", mensagem: `Conta "${g.descricao}" vence em ${diasRestantes} dias — ${brl(g.valor)}`, href: "/admin/financeiro" });
    }
  });

  // 5. Dia de trabalho sem fechamento de caixa (após as 20h)
  if (agora.getHours() >= 20) {
    const temFechamentoHoje = fechamentos.some((f) => f.data === hoje);
    const temAtendimentosHoje = agendamentos.some((a) => a.data === hoje && a.status === "concluido");
    if (!temFechamentoHoje && temAtendimentosHoje) {
      alertas.push({ id: "sem_fechamento", nivel: "amarelo", mensagem: "Caixa do dia ainda não foi fechado", href: "/admin/agendamentos" });
    }
  }

  // Ordena: vermelho > laranja > amarelo > azul
  const ordem: Record<AlertaNivel, number> = { vermelho: 0, laranja: 1, amarelo: 2, azul: 3 };
  return alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

export default function AdminDashboard() {
  const hoje = new Date();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mesCalendario, setMesCalendario] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [alertasDismissed, setAlertasDismissed] = useState<Set<string>>(new Set());
  const jaVisualizou = useRef(false);

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

  useEffect(() => { carregar(); }, [carregar]);

  // Marca agendamentos como visualizados ao entrar no dashboard (1x por sessão)
  useEffect(() => {
    if (!jaVisualizou.current && !carregando) {
      jaVisualizou.current = true;
      fetch("/api/admin/agendamentos-visualizar", { method: "POST", credentials: "include" });
    }
  }, [carregando]);

  // Recalcula alertas a cada minuto para os timers
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const mesAtual = hoje.getMonth(); const anoAtual = hoje.getFullYear();
  const fechamentosMes = fechamentos.filter((f) => { const d = new Date(f.data + "T12:00:00"); return d.getMonth() === mesAtual && d.getFullYear() === anoAtual; });
  const faturamentoMes = fechamentosMes.reduce((s, f) => s + f.totalServicos, 0);
  const servicosMes = fechamentosMes.reduce((s, f) => s + f.quantidadeAtendidos, 0);
  const ticketMedio = servicosMes > 0 ? faturamentoMes / servicosMes : 0;
  const gastosAtivos = gastos.filter((g) => g.ativo);
  const totalGastos = gastosAtivos.reduce((s, g) => s + gastoMensalEquivalente(g), 0);
  const lucroEstimado = faturamentoMes - totalGastos;

  const hojeKey = toDateKey(hoje);
  const agendamentosHoje = agendamentos.filter((a) => a.data === hojeKey).sort((a, b) => a.horario.localeCompare(b.horario));
  const pendentesHoje = agendamentosHoje.filter((a) => a.status === "pendente" || a.status === "confirmado").length;

  // Gráfico: últimos 30 dias de fechamentos
  const ultimos30 = fechamentos
    .filter((f) => { const d = new Date(f.data + "T12:00:00"); return (Date.now() - d.getTime()) <= 30 * 24 * 3600 * 1000; })
    .sort((a, b) => a.data.localeCompare(b.data));
  let acum = 0;
  const dadosGrafico = ultimos30.map((f) => {
    acum += f.totalServicos;
    return { data: new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), acumulado: acum, valor: f.totalServicos };
  });

  // Calendário
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

  // Ranking de serviços (todos os fechamentos)
  const contadorServicos: Record<string, { quantidade: number; total: number }> = {};
  fechamentos.forEach((f) => { f.agendamentos.forEach((a) => { if (!contadorServicos[a.servico]) contadorServicos[a.servico] = { quantidade: 0, total: 0 }; contadorServicos[a.servico].quantidade++; contadorServicos[a.servico].total += parsePriceNum(a.preco); }); });
  const rankServicos = Object.entries(contadorServicos).sort((a, b) => b[1].quantidade - a[1].quantidade).slice(0, 5);

  // Alertas
  const alertas = calcularAlertas(agendamentos, gastos, fechamentos).filter((a) => !alertasDismissed.has(a.id));

  if (carregando) return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Carregando...</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">

      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 capitalize">{hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Dashboard</h1>
        </div>
        <Link href="/admin/agendamentos" className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-xs font-black tracking-wider uppercase rounded hover:bg-[#c9a84c] transition">
          + Novo agendamento
        </Link>
      </div>

      {/* ── ALERTAS ─────────────────────────────────────────────────────────── */}
      {alertas.length > 0 && (
        <div className="flex flex-col gap-2">
          {alertas.map((alerta) => {
            const s = ALERTA_STYLES[alerta.nivel];
            return (
              <div key={alerta.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${s.bg} ${s.border} ${s.text}`}>
                <span className="shrink-0">{s.icon}</span>
                {alerta.href ? (
                  <Link href={alerta.href} className="flex-1 text-sm font-medium hover:underline">{alerta.mensagem}</Link>
                ) : (
                  <span className="flex-1 text-sm font-medium">{alerta.mensagem}</span>
                )}
                <button onClick={() => setAlertasDismissed((prev) => new Set([...prev, alerta.id]))} className="shrink-0 opacity-50 hover:opacity-100 transition">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${card} p-5`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Faturamento este mês</p>
          <p className="text-2xl font-bold text-[#F5E6C8]">{brl(faturamentoMes)}</p>
          <p className="text-xs text-gray-500 mt-1">{fechamentosMes.length} fechamentos</p>
        </div>
        <div className={`${card} p-5 ${pendentesHoje > 0 ? "border-orange-600/40" : ""}`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Agendamentos hoje</p>
          <p className={`text-2xl font-bold ${pendentesHoje > 0 ? "text-orange-300" : "text-[#F5E6C8]"}`}>{pendentesHoje}</p>
          <p className="text-xs text-gray-500 mt-1">pendentes / confirmados</p>
        </div>
        <div className={`${card} p-5 border ${lucroEstimado >= 0 ? "border-green-800/30" : "border-red-800/30"}`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Lucro estimado</p>
          <p className={`text-2xl font-bold ${lucroEstimado >= 0 ? "text-green-400" : "text-red-400"}`}>{brl(lucroEstimado)}</p>
          <p className="text-xs text-gray-500 mt-1">Gastos: {brl(totalGastos)}/mês</p>
        </div>
        <div className={`${card} p-5`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Ticket médio</p>
          <p className="text-2xl font-bold text-[#F5E6C8]">{brl(ticketMedio)}</p>
          <p className="text-xs text-gray-500 mt-1">{servicosMes} serviços este mês</p>
        </div>
      </div>

      {/* ── CORPO PRINCIPAL: gráfico + agendamentos ─────────────────────────── */}
      <div className="grid md:grid-cols-[1fr_380px] gap-5">

        {/* gráfico de faturamento acumulado */}
        <div className={`${card} p-6 flex flex-col gap-4`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500">Faturamento por caixa (últimos 30 dias)</p>
              <p className="text-xs text-gray-600 mt-0.5">Receita acumulada</p>
              <p className="text-2xl font-bold text-[#F5E6C8] mt-1">{brl(faturamentoMes)}</p>
              {ultimos30.length > 0 && (() => {
                const melhor = [...ultimos30].sort((a, b) => b.totalServicos - a.totalServicos)[0];
                return <p className="text-xs text-[#b8944a] mt-0.5">Melhor dia: {new Date(melhor.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {brl(melhor.totalServicos)}</p>;
              })()}
            </div>
            <Link href="/admin/financeiro" className="text-xs text-[#b8944a] hover:underline whitespace-nowrap">Ver tudo →</Link>
          </div>

          {dadosGrafico.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-sm text-gray-500">Nenhum fechamento nos últimos 30 dias.</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosGrafico} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                  <XAxis dataKey="data" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} width={42} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #2d2d2d", borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: "#F5E6C8", marginBottom: 4 }}
                    formatter={(value) => [brl(Number(value)), "Acumulado"]}
                  />
                  <Area type="monotone" dataKey="acumulado" stroke="#C9A84C" strokeWidth={2} fill="url(#gradDash)" dot={false} activeDot={{ r: 4, fill: "#C9A84C" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* agendamentos recentes */}
        <div className={`${card} flex flex-col`}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1a1a1a]">
            <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500">Agendamentos recentes</p>
            <Link href="/admin/agendamentos" className="text-xs text-[#b8944a] hover:underline">Ver todos →</Link>
          </div>
          <div className="flex-1 flex flex-col divide-y divide-[#1a1a1a] overflow-y-auto max-h-72">
            {agendamentos.slice(0, 12).map((ag) => {
              const naoVisto = ag.visualizadoAdmin === false;
              const statusColor =
                ag.status === "concluido" ? "text-green-400" :
                ag.status === "cancelado" ? "text-gray-500 line-through" :
                ag.status === "confirmado" ? "text-blue-400" : "text-orange-300";
              const statusLabel =
                ag.status === "concluido" ? "Concluído" :
                ag.status === "cancelado" ? "Cancelado" :
                ag.status === "confirmado" ? "Confirmado" : "Pendente";
              return (
                <Link key={ag.id} href="/admin/agendamentos" className="flex items-center justify-between px-5 py-3 hover:bg-[#151515] transition gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {naoVisto && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F5E6C8] truncate">{ag.nome}</p>
                      <p className="text-xs text-gray-500 truncate">{ag.servico}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#b8944a]">{ag.preco ? `R$ ${ag.preco}` : "—"}</p>
                    <p className={`text-xs font-medium ${statusColor}`}>{statusLabel}</p>
                  </div>
                </Link>
              );
            })}
            {agendamentos.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-12">
                <p className="text-sm text-gray-500">Nenhum agendamento ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CALENDÁRIO + RANKING ─────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* calendário */}
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#F5E6C8] flex items-center gap-2 text-sm"><CalendarCheck size={15} className="text-[#b8944a]" /> Agendamentos</h2>
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
        </div>

        {/* ranking de serviços */}
        <div className={`${card} p-5`}>
          <h2 className="font-semibold text-[#F5E6C8] flex items-center gap-2 mb-4 text-sm"><Scissors size={15} className="text-[#b8944a]" /> Serviços mais realizados</h2>
          {rankServicos.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Nenhum serviço concluído ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {rankServicos.map(([servico, dados], idx) => {
                const pct = (dados.quantidade / rankServicos[0][1].quantidade) * 100;
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
    </div>
  );
}
