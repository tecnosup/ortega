"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, DollarSign, Receipt, BarChart2, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { FechamentoDia } from "@/lib/agendamentos";
import type { Gasto, CategoriaGasto, FrequenciaGasto } from "@/lib/gastos-tipos";
import { CATEGORIA_LABEL, FREQUENCIA_LABEL, gastoMensalEquivalente } from "@/lib/gastos-tipos";

function brl(v: number) { return `R$ ${v.toFixed(2).replace(".", ",")}` }
const card = "bg-[#111] border border-[#2d2d2d] rounded-lg";
const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-1.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

type Periodo = "7d" | "30d" | "mes_atual" | "mes_anterior";
const PERIODO_LABEL: Record<Periodo, string> = { "7d": "Últimos 7 dias", "30d": "Últimos 30 dias", "mes_atual": "Este mês", "mes_anterior": "Mês anterior" };
const DONUT_COLORS = ["#C9A84C", "#a07830", "#6b5020", "#8b6914", "#d4b060", "#e8c878"];

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
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<"financeiro" | "gastos">("financeiro");
  const [periodo, setPeriodo] = useState<Periodo>("mes_atual");
  const [mostraFormGasto, setMostraFormGasto] = useState(false);
  const [editandoGasto, setEditandoGasto] = useState<Gasto | null>(null);
  const [salvandoGasto, setSalvandoGasto] = useState(false);

  const carregar = useCallback(async () => {
    const [resFech, resGastos] = await Promise.all([
      fetch("/api/fechamento", { credentials: "include" }),
      fetch("/api/gastos", { credentials: "include" }),
    ]);
    setFechamentos(await resFech.json());
    if (resGastos.ok) setGastos(await resGastos.json());
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

  let acum = 0;
  const dadosGrafico = fechsPeriodo.map((f) => {
    acum += f.totalServicos;
    return { data: new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), acumulado: acum, valor: f.totalServicos };
  });

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

  const abaBtn = (id: typeof aba, label: string) => (
    <button onClick={() => setAba(id)} className={`px-4 py-1.5 text-sm font-medium rounded transition ${aba === id ? "bg-[#1a1a1a] text-[#b8944a]" : "text-gray-500 hover:text-gray-300"}`}>{label}</button>
  );

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Financeiro</h1>
        <p className="text-sm text-gray-500">Visão geral de faturamento, gastos e lucro estimado.</p>
      </div>

      <div className={`flex gap-1 ${card} p-1 w-fit`}>
        {abaBtn("financeiro", "Financeiro")}
        {abaBtn("gastos", "Gastos")}
      </div>

      {/* ── ABA FINANCEIRO ── */}
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
            <div className={`${card} p-5`}>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Faturamento este mês</p>
              <p className="text-3xl font-bold text-[#F5E6C8]">{brl(totalPeriodo)}</p>
              {varPct !== null && (
                <p className={`text-xs mt-2 ${varPct > 0 ? "text-green-400" : varPct < 0 ? "text-red-400" : "text-gray-500"}`}>
                  {varPct > 0 ? "↑" : "↓"} {Math.abs(varPct).toFixed(1)}% vs anterior
                </p>
              )}
            </div>
            <div className={`${card} p-5`}>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Gastos recorrentes/mês</p>
              <p className="text-3xl font-bold text-[#F5E6C8]">{brl(totalMensalGastos)}</p>
            </div>
            <div className={`${card} p-5 border ${lucroEstimado >= 0 ? "border-green-800/40" : "border-red-800/40"}`}>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Lucro estimado</p>
              <p className={`text-3xl font-bold ${lucroEstimado >= 0 ? "text-green-400" : "text-red-400"}`}>{brl(lucroEstimado)}</p>
            </div>
            <div className={`${card} p-5`}>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Receita total (pedidos)</p>
              <p className="text-3xl font-bold text-[#F5E6C8]">{brl(fechamentos.reduce((s, f) => s + f.totalServicos, 0))}</p>
            </div>
          </div>

          <div className={`${card} p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500">Faturamento por fechamento de caixa</p>
                <p className="text-2xl font-bold text-[#F5E6C8] mt-1">{brl(totalPeriodo)}</p>
                {melhorDia && <p className="text-xs text-[#b8944a] mt-0.5">Melhor dia: {new Date(melhorDia.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {brl(melhorDia.totalServicos)}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500">Gastos/mês</p>
                <p className="text-lg font-bold text-gray-400 mt-1">{brl(totalMensalGastos)}</p>
              </div>
            </div>
            {fechsPeriodo.length === 0 ? (
              <p className="text-sm text-gray-500 py-16 text-center">Nenhum fechamento de caixa no período.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosGrafico} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradFin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                    <XAxis dataKey="data" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} width={42} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #2d2d2d", borderRadius: 6, fontSize: 12 }} labelStyle={{ color: "#F5E6C8", marginBottom: 4 }} formatter={(v) => [brl(Number(v)), "Acumulado"]} />
                    <Area type="monotone" dataKey="acumulado" stroke="#C9A84C" strokeWidth={2} fill="url(#gradFin)" dot={false} activeDot={{ r: 4, fill: "#C9A84C" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className={`${card} p-6`}>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-4">Gastos por categoria (ativos)</p>
              {donutData.length === 0 ? <p className="text-sm text-gray-500 py-12 text-center">Nenhum gasto ativo.</p> : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid #2d2d2d", borderRadius: 6, fontSize: 12 }} formatter={(v) => [brl(Number(v)), "Gasto/mês"]} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#888" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className={`${card} p-6`}>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-4">Fechamentos de caixa</p>
              {fechsPeriodo.length === 0 ? <p className="text-sm text-gray-500 py-12 text-center">Nenhum fechamento no período.</p> : (
                <div className="flex flex-col divide-y divide-[#1a1a1a]">
                  {[...fechsPeriodo].reverse().map((f) => (
                    <div key={f.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-[#F5E6C8] capitalize">{new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}</p>
                        <p className="text-xs text-gray-500">{f.quantidadeAtendidos} serviço{f.quantidadeAtendidos !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-sm font-bold text-[#b8944a]">{brl(f.totalServicos)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3"><span className="text-sm font-semibold text-gray-400">Total</span><span className="text-sm font-bold text-[#F5E6C8]">{brl(totalPeriodo)}</span></div>
                </div>
              )}
            </div>
          </div>

          {rankServicos.length > 0 && (
            <div className={`${card} p-6`}>
              <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-4">Serviços no período</p>
              <div className="flex flex-col gap-3">
                {rankServicos.map(([servico, dados], idx) => {
                  const pct = (dados.quantidade / rankServicos[0][1].quantidade) * 100;
                  return (
                    <div key={servico} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-4">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1"><span className="font-medium text-[#F5E6C8]">{servico}</span><span className="text-gray-500">{dados.quantidade}x · {brl(dados.total)}</span></div>
                        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden"><div className="h-full bg-[#b8944a] rounded-full" style={{ width: `${pct}%` }} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ABA GASTOS ── */}
      {aba === "gastos" && (() => {
        const maxCat = Math.max(...Object.values(porCategoria), 1);
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className={`${card} p-5`}><p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Gastos mensais</p><p className="text-3xl font-bold text-[#F5E6C8]">{brl(totalMensalGastos)}</p><p className="text-xs text-gray-500 mt-1">{gastosAtivos.length} ativo{gastosAtivos.length !== 1 ? "s" : ""}</p></div>
              <div className={`${card} p-5`}><p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Faturamento do mês</p><p className="text-3xl font-bold text-[#F5E6C8]">{brl(fechamentos.filter((f) => { const d = new Date(f.data + "T12:00:00"); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).reduce((s, f) => s + f.totalServicos, 0))}</p></div>
              <div className={`bg-[#111] border ${lucroEstimado >= 0 ? "border-green-800/40" : "border-red-800/40"} rounded-lg p-5 col-span-2 md:col-span-1`}>
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-2">Lucro estimado</p>
                <p className={`text-3xl font-bold ${lucroEstimado >= 0 ? "text-green-400" : "text-red-400"}`}>{brl(lucroEstimado)}</p>
              </div>
            </div>

            {Object.keys(porCategoria).length > 0 && (
              <div className={`${card} p-5`}>
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-4">Gastos por categoria</p>
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
                  <div key={g.id} className={`${card} p-4 flex items-center gap-3 ${!g.ativo ? "opacity-50" : ""}`}>
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
    </div>
  );
}
