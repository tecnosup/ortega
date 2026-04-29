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

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// ─── form de gasto ────────────────────────────────────────────────────────────

function FormGasto({ inicial, onSalvar, onCancelar, salvando }: {
  inicial?: Partial<Gasto>;
  onSalvar: (d: Partial<Gasto>) => void;
  onCancelar: () => void;
  salvando: boolean;
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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
      <h4 className="font-semibold text-gray-900 text-sm">{inicial?.id ? "Editar gasto" : "Novo gasto recorrente"}</h4>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Descrição *</label>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="ex: Aluguel do espaço" className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#b8944a]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Categoria *</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaGasto)} className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#b8944a]">
            {(Object.keys(CATEGORIA_LABEL) as CategoriaGasto[]).map((c) => (
              <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Valor (R$) *</label>
          <input type="number" min="0" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#b8944a]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Frequência *</label>
          <select value={frequencia} onChange={(e) => setFrequencia(e.target.value as FrequenciaGasto)} className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#b8944a]">
            {(Object.keys(FREQUENCIA_LABEL) as FrequenciaGasto[]).map((f) => (
              <option key={f} value={f}>{FREQUENCIA_LABEL[f]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Dia de vencimento</label>
          <input type="number" min="1" max="31" value={vencimento} onChange={(e) => setVencimento(e.target.value)} placeholder="ex: 5" className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#b8944a]" />
        </div>
        <div className="flex flex-col gap-1 justify-end">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer pb-1">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="accent-[#b8944a]" />
            Ativo
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={salvando} className="px-4 py-1.5 bg-[#1a1a1a] text-white text-xs font-medium rounded hover:bg-[#2d2d2d] transition disabled:opacity-50">
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button onClick={onCancelar} className="px-4 py-1.5 border border-gray-200 text-gray-600 text-xs rounded hover:border-gray-400 transition">Cancelar</button>
      </div>
    </div>
  );
}

const PERIODO_LABEL: Record<Periodo, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "mes_atual": "Este mês",
  "mes_anterior": "Mês anterior",
};

// ─── componente ───────────────────────────────────────────────────────────────

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
      fetch("/api/agendamentos"),
      fetch("/api/fechamento"),
      fetch("/api/gastos"),
    ]);
    setAgendamentos(await resAgs.json());
    setFechamentos(await resFech.json());
    if (resGastos.ok) setGastos(await resGastos.json());
    setCarregando(false);
  }, []);

  async function salvarGasto(data: Partial<Gasto>) {
    setSalvandoGasto(true);
    if (editandoGasto) {
      await fetch(`/api/gastos/${editandoGasto.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setEditandoGasto(null);
    } else {
      await fetch("/api/gastos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setMostraFormGasto(false);
    }
    setSalvandoGasto(false);
    carregar();
  }

  async function toggleGasto(g: Gasto) {
    await fetch(`/api/gastos/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !g.ativo }) });
    carregar();
  }

  async function excluirGasto(id: string) {
    if (!confirm("Excluir este gasto?")) return;
    await fetch(`/api/gastos/${id}`, { method: "DELETE" });
    carregar();
  }

  useEffect(() => { carregar(); }, [carregar]);

  // ── filtro de período ─────────────────────────────────────────────────────
  function getFechamentosPeriodo(p: Periodo): FechamentoDia[] {
    const agora = new Date();
    return fechamentos.filter((f) => {
      const d = new Date(f.data + "T12:00:00");
      if (p === "7d") {
        const limite = new Date(agora); limite.setDate(limite.getDate() - 7);
        return d >= limite;
      }
      if (p === "30d") {
        const limite = new Date(agora); limite.setDate(limite.getDate() - 30);
        return d >= limite;
      }
      if (p === "mes_atual") {
        return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
      }
      if (p === "mes_anterior") {
        const mesAnt = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1;
        const anoAnt = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
        return d.getMonth() === mesAnt && d.getFullYear() === anoAnt;
      }
      return false;
    });
  }

  // ── KPIs do overview (mês atual) ─────────────────────────────────────────
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const fechamentosMes = fechamentos.filter((f) => {
    const d = new Date(f.data + "T12:00:00");
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const faturamentoMes = fechamentosMes.reduce((s, f) => s + f.totalServicos, 0);
  const servicosMes = fechamentosMes.reduce((s, f) => s + f.quantidadeAtendidos, 0);
  const ticketMedio = servicosMes > 0 ? faturamentoMes / servicosMes : 0;

  const agendamentosHoje = agendamentos.filter((a) => a.data === toDateKey(hoje));
  const pendentesHoje = agendamentosHoje.filter((a) => a.status === "pendente" || a.status === "confirmado").length;

  const kpis = [
    { label: "Faturamento do mês", value: brl(faturamentoMes), icon: DollarSign, cor: "text-[#b8944a]", bg: "bg-amber-50" },
    { label: "Serviços realizados", value: servicosMes, icon: Scissors, cor: "text-blue-600", bg: "bg-blue-50" },
    { label: "Ticket médio", value: brl(ticketMedio), icon: TrendingUp, cor: "text-green-600", bg: "bg-green-50" },
    { label: "Agendamentos hoje", value: pendentesHoje, icon: Users, cor: "text-purple-600", bg: "bg-purple-50" },
  ];

  // ── calendário mini ───────────────────────────────────────────────────────
  const ano = mesCalendario.getFullYear();
  const mes = mesCalendario.getMonth();
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

  // ── dados financeiros por período ────────────────────────────────────────
  const fechsPeriodo = getFechamentosPeriodo(periodo).sort((a, b) => a.data.localeCompare(b.data));
  const totalPeriodo = fechsPeriodo.reduce((s, f) => s + f.totalServicos, 0);
  const servicosPeriodo = fechsPeriodo.reduce((s, f) => s + f.quantidadeAtendidos, 0);
  const ticketPeriodo = servicosPeriodo > 0 ? totalPeriodo / servicosPeriodo : 0;
  const maxFatPeriodo = Math.max(...fechsPeriodo.map((f) => f.totalServicos), 1);

  // variação vs período anterior (comparação simples de dias equivalentes)
  const fechsAnt = (() => {
    const agora = new Date();
    if (periodo === "mes_atual") {
      const mesAnt = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1;
      const anoAnt = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
      return fechamentos.filter((f) => {
        const d = new Date(f.data + "T12:00:00");
        return d.getMonth() === mesAnt && d.getFullYear() === anoAnt;
      });
    }
    if (periodo === "7d") {
      const fim = new Date(agora); fim.setDate(fim.getDate() - 7);
      const ini = new Date(agora); ini.setDate(ini.getDate() - 14);
      return fechamentos.filter((f) => {
        const d = new Date(f.data + "T12:00:00");
        return d >= ini && d < fim;
      });
    }
    return [];
  })();
  const totalAnt = fechsAnt.reduce((s, f) => s + f.totalServicos, 0);
  const varPct = totalAnt > 0 ? ((totalPeriodo - totalAnt) / totalAnt) * 100 : null;

  // ── serviços mais realizados (por período) ────────────────────────────────
  const contadorServicos: Record<string, { quantidade: number; total: number }> = {};
  fechsPeriodo.forEach((f) => {
    f.agendamentos.forEach((a) => {
      if (!contadorServicos[a.servico]) contadorServicos[a.servico] = { quantidade: 0, total: 0 };
      contadorServicos[a.servico].quantidade++;
      contadorServicos[a.servico].total += parsePriceNum(a.preco);
    });
  });
  const rankServicos = Object.entries(contadorServicos)
    .sort((a, b) => b[1].quantidade - a[1].quantidade)
    .slice(0, 5);

  // ── serviços ranking overview ─────────────────────────────────────────────
  const contadorOverview: Record<string, { quantidade: number; total: number }> = {};
  fechamentos.forEach((f) => {
    f.agendamentos.forEach((a) => {
      if (!contadorOverview[a.servico]) contadorOverview[a.servico] = { quantidade: 0, total: 0 };
      contadorOverview[a.servico].quantidade++;
      contadorOverview[a.servico].total += parsePriceNum(a.preco);
    });
  });
  const rankOverview = Object.entries(contadorOverview)
    .sort((a, b) => b[1].quantidade - a[1].quantidade)
    .slice(0, 5);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
        <span className="text-sm text-gray-400 capitalize">
          {hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      {/* abas */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setAba("overview")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition ${
            aba === "overview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <CalendarCheck size={14} /> Overview
        </button>
        <button
          onClick={() => setAba("financeiro")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition ${
            aba === "financeiro" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BarChart2 size={14} /> Financeiro
        </button>
        <button
          onClick={() => setAba("gastos")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition ${
            aba === "gastos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Receipt size={14} /> Gastos
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ABA OVERVIEW                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {aba === "overview" && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3">
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center ${k.cor}`}>
                  <k.icon size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{k.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* calendário */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarCheck size={16} className="text-[#b8944a]" />
                  Agendamentos
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMesCalendario(new Date(ano, mes - 1, 1))} className="p-1 hover:text-[#b8944a] transition">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-medium text-gray-600 w-20 text-center">
                    {MESES[mes]} {ano}
                  </span>
                  <button onClick={() => setMesCalendario(new Date(ano, mes + 1, 1))} className="p-1 hover:text-[#b8944a] transition">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA_MINI.map((d, i) => (
                  <div key={i} className={`text-center text-xs py-1 ${i === 0 ? "text-red-400" : "text-gray-400"}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {celulas.map((cell, i) => {
                  if (!cell.atual || cell.dia === 0) return <div key={i} className="h-9" />;
                  const count = contarAgsDia(cell.dia);
                  const key = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(cell.dia).padStart(2, "0")}`;
                  const eHoje = key === toDateKey(hoje);
                  return (
                    <Link key={i} href={`/admin/agendamentos?data=${key}`}
                      className={`h-9 flex flex-col items-center justify-center rounded text-xs transition hover:bg-amber-50 ${eHoje ? "bg-[#1a1a1a] text-white hover:bg-[#2d2d2d]" : "text-gray-700"}`}
                    >
                      <span className={eHoje ? "font-bold" : ""}>{cell.dia}</span>
                      {count > 0 && <span className="text-[9px] font-medium text-[#b8944a]">{count}</span>}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Números = qtd. de agendamentos</span>
                <Link href="/admin/agendamentos" className="text-[#b8944a] hover:underline">Ver todos →</Link>
              </div>
            </div>

            {/* ranking */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Scissors size={16} className="text-[#b8944a]" />
                Serviços mais realizados
              </h2>
              {rankOverview.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Nenhum serviço concluído ainda.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {rankOverview.map(([servico, dados], idx) => {
                    const maxQtd = rankOverview[0][1].quantidade;
                    const pct = (dados.quantidade / maxQtd) * 100;
                    return (
                      <div key={servico} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="font-medium text-gray-800">{servico}</span>
                            <span className="text-gray-400">{dados.quantidade}x · {brl(dados.total)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#b8944a] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* agenda de hoje */}
          {agendamentosHoje.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Agenda de hoje</h2>
                <Link href="/admin/agendamentos" className="text-xs text-[#b8944a] hover:underline">Gerenciar →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {agendamentosHoje
                  .sort((a, b) => a.horario.localeCompare(b.horario))
                  .map((ag) => (
                    <div key={ag.id} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 font-mono w-12">{ag.horario}</span>
                      <span className="font-medium text-gray-900">{ag.nome}</span>
                      <span className="text-gray-400 flex-1">{ag.servico}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        ag.status === "concluido" ? "bg-green-50 text-green-700 border-green-200" :
                        ag.status === "confirmado" ? "bg-blue-50 text-blue-600 border-blue-200" :
                        ag.status === "cancelado" ? "bg-red-50 text-red-500 border-red-200" :
                        "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }`}>
                        {ag.status === "concluido" ? "Concluído" :
                         ag.status === "confirmado" ? "Confirmado" :
                         ag.status === "cancelado" ? "Cancelado" : "Pendente"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ABA GASTOS                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {aba === "gastos" && (() => {
        const gastosAtivos = gastos.filter((g) => g.ativo);
        const totalMensal = gastosAtivos.reduce((s, g) => s + gastoMensalEquivalente(g), 0);
        const faturamentoMesNum = faturamentoMes;
        const lucroEstimado = faturamentoMesNum - totalMensal;

        const porCategoria: Record<string, number> = {};
        gastosAtivos.forEach((g) => {
          const cat = CATEGORIA_LABEL[g.categoria];
          porCategoria[cat] = (porCategoria[cat] ?? 0) + gastoMensalEquivalente(g);
        });
        const maxCat = Math.max(...Object.values(porCategoria), 1);

        return (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-500 mb-3"><Receipt size={18} /></div>
                <p className="text-xs text-gray-400 mb-0.5">Gastos mensais</p>
                <p className="text-2xl font-bold text-gray-900">{brl(totalMensal)}</p>
                <p className="text-xs text-gray-400 mt-1">{gastosAtivos.length} item{gastosAtivos.length !== 1 ? "s" : ""} ativo{gastosAtivos.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-[#b8944a] mb-3"><DollarSign size={18} /></div>
                <p className="text-xs text-gray-400 mb-0.5">Faturamento do mês</p>
                <p className="text-2xl font-bold text-gray-900">{brl(faturamentoMesNum)}</p>
              </div>
              <div className={`bg-white border rounded-lg p-5 col-span-2 md:col-span-1 ${lucroEstimado >= 0 ? "border-green-200" : "border-red-200"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${lucroEstimado >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                  <TrendingUp size={18} />
                </div>
                <p className="text-xs text-gray-400 mb-0.5">Lucro estimado</p>
                <p className={`text-2xl font-bold ${lucroEstimado >= 0 ? "text-green-700" : "text-red-600"}`}>{brl(lucroEstimado)}</p>
                <p className="text-xs text-gray-400 mt-1">fat. - gastos recorrentes</p>
              </div>
            </div>

            {/* gráfico por categoria */}
            {Object.keys(porCategoria).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <BarChart2 size={16} className="text-[#b8944a]" /> Gastos por categoria
                </h2>
                <div className="flex flex-col gap-3">
                  {Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24 shrink-0">{cat}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${(val / maxCat) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-24 text-right shrink-0">{brl(val)}/mês</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* botão novo + form */}
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Gastos recorrentes</h2>
              <button
                onClick={() => { setEditandoGasto(null); setMostraFormGasto(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-medium rounded hover:bg-[#2d2d2d] transition"
              >
                <Plus size={14} /> Novo gasto
              </button>
            </div>

            {mostraFormGasto && !editandoGasto && (
              <FormGasto onSalvar={salvarGasto} onCancelar={() => setMostraFormGasto(false)} salvando={salvandoGasto} />
            )}
            {editandoGasto && (
              <FormGasto inicial={editandoGasto} onSalvar={salvarGasto} onCancelar={() => setEditandoGasto(null)} salvando={salvandoGasto} />
            )}

            {/* lista */}
            {gastos.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <Receipt size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nenhum gasto cadastrado.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {gastos.map((g) => (
                  <div key={g.id} className={`bg-white border rounded-lg p-4 flex items-center gap-3 transition ${g.ativo ? "border-gray-200" : "border-gray-100 opacity-55"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{g.descricao}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{CATEGORIA_LABEL[g.categoria]}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{FREQUENCIA_LABEL[g.frequencia]}</span>
                        {!g.ativo && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">inativo</span>}
                      </div>
                      {g.vencimento && <p className="text-xs text-gray-400 mt-0.5">Vence dia {g.vencimento}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-red-600 text-sm">{brl(g.valor)}</p>
                      {g.frequencia !== "mensal" && g.ativo && (
                        <p className="text-xs text-gray-400">{brl(gastoMensalEquivalente(g))}/mês</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleGasto(g)} className={`p-1.5 rounded transition ${g.ativo ? "text-green-600 hover:text-green-700" : "text-gray-300 hover:text-gray-500"}`} title={g.ativo ? "Desativar" : "Ativar"}>
                        {g.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => { setMostraFormGasto(false); setEditandoGasto(g); }} className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition" title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => excluirGasto(g.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ABA FINANCEIRO                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {aba === "financeiro" && (
        <>
          {/* filtro de período */}
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(PERIODO_LABEL) as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 text-sm rounded-full border transition ${
                  periodo === p
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#b8944a]"
                }`}
              >
                {PERIODO_LABEL[p]}
              </button>
            ))}
          </div>

          {/* KPIs financeiros */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* faturamento */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 col-span-2 md:col-span-1">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-[#b8944a] mb-3">
                <DollarSign size={18} />
              </div>
              <p className="text-xs text-gray-400 mb-0.5">Faturamento</p>
              <p className="text-2xl font-bold text-gray-900">{brl(totalPeriodo)}</p>
              {varPct !== null && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${varPct > 0 ? "text-green-600" : varPct < 0 ? "text-red-500" : "text-gray-400"}`}>
                  {varPct > 0 ? <ArrowUpRight size={12} /> : varPct < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                  {varPct > 0 ? "+" : ""}{varPct.toFixed(1)}% vs período anterior
                </div>
              )}
            </div>

            {/* serviços */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                <Scissors size={18} />
              </div>
              <p className="text-xs text-gray-400 mb-0.5">Serviços</p>
              <p className="text-2xl font-bold text-gray-900">{servicosPeriodo}</p>
              <p className="text-xs text-gray-400 mt-1">{fechsPeriodo.length} dias com caixa fechado</p>
            </div>

            {/* ticket médio */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-600 mb-3">
                <TrendingUp size={18} />
              </div>
              <p className="text-xs text-gray-400 mb-0.5">Ticket médio</p>
              <p className="text-2xl font-bold text-gray-900">{brl(ticketPeriodo)}</p>
            </div>

            {/* melhor dia */}
            {fechsPeriodo.length > 0 && (() => {
              const melhor = fechsPeriodo.reduce((a, b) => b.totalServicos > a.totalServicos ? b : a);
              const dataLabel = new Date(melhor.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
              return (
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-3">
                    <BarChart2 size={18} />
                  </div>
                  <p className="text-xs text-gray-400 mb-0.5">Melhor dia</p>
                  <p className="text-2xl font-bold text-gray-900">{dataLabel}</p>
                  <p className="text-xs text-gray-400 mt-1">{brl(melhor.totalServicos)}</p>
                </div>
              );
            })()}
          </div>

          {/* gráfico de barras */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-[#b8944a]" />
              Faturamento por dia
            </h2>
            {fechsPeriodo.length === 0 ? (
              <p className="text-sm text-gray-400 py-12 text-center">Nenhum fechamento de caixa no período selecionado.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {fechsPeriodo.map((f) => {
                  const altura = Math.max((f.totalServicos / maxFatPeriodo) * 100, 3);
                  const dataLabel = new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                  const isMelhor = f.totalServicos === maxFatPeriodo;
                  return (
                    <div key={f.id} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition">
                        {brl(f.totalServicos)}
                      </span>
                      <div
                        className={`w-full rounded-t transition ${isMelhor ? "bg-[#b8944a]" : "bg-[#b8944a]/40 group-hover:bg-[#b8944a]/70"}`}
                        style={{ height: `${altura}%` }}
                        title={`${dataLabel} · ${brl(f.totalServicos)}`}
                      />
                      <span className="text-[9px] text-gray-400">{dataLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ranking de serviços no período */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Scissors size={16} className="text-[#b8944a]" />
                Serviços no período
              </h2>
              {rankServicos.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Nenhum serviço concluído no período.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {rankServicos.map(([servico, dados], idx) => {
                    const maxQtd = rankServicos[0][1].quantidade;
                    const pct = (dados.quantidade / maxQtd) * 100;
                    return (
                      <div key={servico} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="font-medium text-gray-800">{servico}</span>
                            <span className="text-gray-400">{dados.quantidade}x · {brl(dados.total)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#b8944a] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* tabela de fechamentos */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Lock size={16} className="text-[#b8944a]" />
                Fechamentos de caixa
              </h2>
              {fechsPeriodo.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Nenhum fechamento no período.</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100">
                  {[...fechsPeriodo].reverse().map((f) => {
                    const dataLabel = new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", {
                      weekday: "short", day: "numeric", month: "short",
                    });
                    return (
                      <div key={f.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{dataLabel}</p>
                          <p className="text-xs text-gray-400">{f.quantidadeAtendidos} serviço{f.quantidadeAtendidos !== 1 ? "s" : ""}</p>
                        </div>
                        <span className="text-sm font-bold text-[#b8944a]">{brl(f.totalServicos)}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-sm font-semibold text-gray-700">Total</span>
                    <span className="text-sm font-bold text-gray-900">{brl(totalPeriodo)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
