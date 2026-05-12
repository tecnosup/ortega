"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Lock, Unlock, X, Plus, Trash2 } from "lucide-react";
import type { FechamentoDia, Agendamento } from "@/lib/agendamentos-types";
import type { GastoDia } from "@/lib/gastos-dia-tipos";
import { parsePriceNum } from "@/lib/agendamentos-types";

function brl(v: number) { return `R$ ${v.toFixed(2).replace(".", ",")}` }
function toDataStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-1.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full";

// ── Modal estilizado ──────────────────────────────────────────────────────────
function ModalConfirm({ titulo, mensagem, confirmLabel, confirmClass, onConfirm, onCancel }: {
  titulo: string; mensagem: string; confirmLabel: string;
  confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={onCancel}>
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-[#F5E6C8]">{titulo}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{mensagem}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">Cancelar</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm rounded transition ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Form gasto do dia ─────────────────────────────────────────────────────────
function FormGastoDia({ data, onSalvo, onCancelar }: {
  data: string; onSalvo: () => void; onCancelar: () => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!descricao.trim()) { setErro("Descrição obrigatória"); return; }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro("Valor inválido"); return; }
    setSalvando(true);
    const res = await fetch("/api/gastos-dia", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, descricao, valor: Number(valor) }),
    });
    setSalvando(false);
    if (res.ok) onSalvo();
    else setErro("Erro ao salvar");
  }

  return (
    <div className="bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-4 flex flex-col gap-3 mt-2">
      <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Registrar gasto do dia</p>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Produto comprado, material..." className={inp} />
      <input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor (R$)" className={inp} />
      <div className="flex gap-2">
        <button onClick={salvar} disabled={salvando} className="px-4 py-1.5 bg-red-900/50 border border-red-800/60 text-red-300 text-xs font-bold rounded hover:bg-red-900/70 transition disabled:opacity-50">
          {salvando ? "Salvando..." : "Registrar gasto"}
        </button>
        <button onClick={onCancelar} className="px-4 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] transition">Cancelar</button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
interface Props {
  fechamentos: FechamentoDia[];
  gastosDia: GastoDia[];
  onAtualizar: () => void;
}

export default function CaixaCalendario({ fechamentos, gastosDia, onAtualizar }: Props) {
  const hoje = new Date().toISOString().split("T")[0];

  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [mes, setMes] = useState(() => new Date().getMonth());
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [agsDia, setAgsDia] = useState<Agendamento[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [reabrindo, setReabrindo] = useState(false);
  const [mostraFormGasto, setMostraFormGasto] = useState(false);
  const [modalReabrir, setModalReabrir] = useState(false);

  // Lê ?dia= da URL na montagem
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("dia");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) {
      setDiaSel(p);
      const d = new Date(p + "T12:00:00");
      setAno(d.getFullYear()); setMes(d.getMonth());
    } else {
      setDiaSel(hoje);
    }
  }, []); // eslint-disable-line

  const fechPorData = Object.fromEntries(fechamentos.map((f) => [f.data, f]));
  const gastosPorData: Record<string, GastoDia[]> = {};
  gastosDia.forEach((g) => { gastosPorData[g.data] = [...(gastosPorData[g.data] ?? []), g]; });

  const carregarAgs = useCallback(async (data: string) => {
    setCarregando(true); setAgsDia(null);
    try {
      const res = await fetch(`/api/agendamentos?data=${data}`, { credentials: "include" });
      if (res.ok) setAgsDia(await res.json());
    } finally { setCarregando(false); }
  }, []);

  useEffect(() => {
    if (!diaSel) { setAgsDia(null); return; }
    setMostraFormGasto(false);
    const fech = fechPorData[diaSel];
    if (fech) setAgsDia(fech.agendamentos);
    else carregarAgs(diaSel);
  }, [diaSel, fechamentos]); // eslint-disable-line

  async function fecharCaixa() {
    if (!diaSel) return;
    setFechando(true);
    try {
      await fetch("/api/fechamento", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: diaSel }),
      });
      onAtualizar();
    } finally { setFechando(false); }
  }

  async function reabrirCaixa() {
    if (!diaSel) return;
    const fech = fechPorData[diaSel];
    if (!fech) return;
    setReabrindo(true);
    try {
      await fetch(`/api/fechamento/${fech.id}`, { method: "DELETE", credentials: "include" });
      onAtualizar();
    } finally { setReabrindo(false); setModalReabrir(false); }
  }

  async function excluirGasto(id: string) {
    await fetch(`/api/gastos-dia/${id}`, { method: "DELETE", credentials: "include" });
    onAtualizar();
  }

  function navMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear()); setMes(d.getMonth());
  }

  // Grid do mês
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  const fechDia = diaSel ? fechPorData[diaSel] : null;
  const gastosDiaSel = diaSel ? (gastosPorData[diaSel] ?? []) : [];
  const totalGastosDiaSel = gastosDiaSel.reduce((s, g) => s + g.valor, 0);
  const concluidos = agsDia?.filter((a) => a.status === "concluido") ?? [];
  const totalAberto = concluidos.reduce((s, a) => s + parsePriceNum(a.preco), 0);
  const ehFuturo = diaSel ? diaSel > hoje : false;
  const ehHoje = diaSel === hoje;
  const totalFaturamento = fechDia?.totalServicos ?? totalAberto;
  const lucroLiquido = totalFaturamento - totalGastosDiaSel;

  return (
    <>
      {modalReabrir && (
        <ModalConfirm
          titulo="Reabrir caixa?"
          mensagem="O fechamento deste dia será excluído. Os agendamentos voltarão a aparecer como abertos."
          confirmLabel={reabrindo ? "Reabrindo..." : "Reabrir"}
          confirmClass="bg-red-900/60 text-red-300 border border-red-800/60 hover:bg-red-900/80"
          onConfirm={reabrirCaixa}
          onCancel={() => setModalReabrir(false)}
        />
      )}

      <div className="bg-[#0A0A0A] border border-[#1e1e1e] rounded-xl overflow-hidden">

        {/* ── Painel do dia ── */}
        {diaSel && (
          <div className="border-b border-[#1e1e1e] p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-bold text-[#F5E6C8] tracking-widest">
                  {new Date(diaSel + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
                {fechDia && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-500 border border-[#2d2d2d] rounded px-1.5 py-0.5">
                    <Lock size={9} /> FECHADO
                  </span>
                )}
                {ehHoje && !fechDia && (
                  <span className="text-[10px] font-bold tracking-widest text-[#b8944a] border border-[#b8944a]/30 rounded px-1.5 py-0.5">HOJE</span>
                )}
              </div>
              <button onClick={() => setDiaSel(null)} className="text-gray-600 hover:text-gray-400 transition"><X size={14} /></button>
            </div>

            {/* KPIs do dia */}
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

            {/* Vendas */}
            {fechDia ? (
              fechDia.agendamentos.length > 0 && (
                <div className="flex flex-col divide-y divide-[#111] mb-3 max-h-32 overflow-y-auto">
                  {fechDia.agendamentos.map((a) => (
                    <div key={a.id} className="flex justify-between items-center py-1.5 text-xs">
                      <span className="text-[#F5E6C8]">{a.nome}<span className="text-gray-600"> · {a.servico}</span></span>
                      <span className="text-[#b8944a] font-medium ml-3 shrink-0">{a.preco}</span>
                    </div>
                  ))}
                </div>
              )
            ) : ehFuturo ? (
              <p className="text-sm text-gray-600 mb-3">Nenhuma venda ainda.</p>
            ) : (
              <>
                {carregando ? (
                  <p className="text-sm text-gray-600 mb-3">Carregando...</p>
                ) : agsDia?.length === 0 ? (
                  <p className="text-sm text-gray-500 mb-3">Nenhuma venda registrada neste dia.</p>
                ) : (
                  concluidos.length > 0 && (
                    <div className="flex flex-col divide-y divide-[#111] mb-3 max-h-32 overflow-y-auto">
                      {concluidos.map((a) => (
                        <div key={a.id} className="flex justify-between items-center py-1.5 text-xs">
                          <span className="text-[#F5E6C8]">{a.nome}<span className="text-gray-600"> · {a.servico}</span></span>
                          <span className="text-[#b8944a] font-medium ml-3 shrink-0">{a.preco}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
            )}

            {/* Gastos do dia */}
            {gastosDiaSel.length > 0 && (
              <div className="flex flex-col divide-y divide-[#111] mb-3 max-h-28 overflow-y-auto border-t border-[#1a1a1a] pt-2 mt-1">
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 pb-1.5">Gastos do dia</p>
                {gastosDiaSel.map((g) => (
                  <div key={g.id} className="flex justify-between items-center py-1.5 text-xs">
                    <span className="text-gray-400">{g.descricao}</span>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-red-400 font-medium">−{brl(g.valor)}</span>
                      <button onClick={() => excluirGasto(g.id)} className="text-gray-700 hover:text-red-400 transition"><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form gasto */}
            {mostraFormGasto && (
              <FormGastoDia
                data={diaSel}
                onSalvo={() => { setMostraFormGasto(false); onAtualizar(); }}
                onCancelar={() => setMostraFormGasto(false)}
              />
            )}

            {/* Botões de ação */}
            {!mostraFormGasto && (
              <div className="flex flex-col gap-2 mt-3">
                {!fechDia && !ehFuturo && (
                  <button onClick={fecharCaixa} disabled={fechando || carregando}
                    className="w-full text-[10px] font-bold tracking-widest border border-[#b8944a]/40 text-[#b8944a] hover:border-[#b8944a] hover:bg-[#b8944a]/5 px-4 py-2.5 rounded transition disabled:opacity-50">
                    {fechando ? "FECHANDO CAIXA..." : ehHoje ? "+ FECHAR CAIXA DO DIA" : "+ FECHAR CAIXA (RETROATIVO)"}
                  </button>
                )}
                {!ehFuturo && (
                  <button onClick={() => setMostraFormGasto(true)}
                    className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest border border-red-900/40 text-red-400/70 hover:border-red-800 hover:text-red-400 px-4 py-2.5 rounded transition">
                    <Plus size={10} /> ADICIONAR GASTO DO DIA
                  </button>
                )}
                {fechDia && (
                  <button onClick={() => setModalReabrir(true)}
                    className="flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest border border-[#2d2d2d] text-gray-600 hover:border-red-800/60 hover:text-red-400 px-4 py-2 rounded transition">
                    <Unlock size={10} /> REABRIR CAIXA
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Calendário ── */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navMes(-1)} className="p-1 text-gray-500 hover:text-gray-300 transition"><ChevronLeft size={16} /></button>
            <span className="text-xs font-bold tracking-widest text-[#F5E6C8]">{MESES[mes]} {ano}</span>
            <button onClick={() => navMes(1)} className="p-1 text-gray-500 hover:text-gray-300 transition"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DIAS.map((d) => <div key={d} className="text-center text-[9px] font-medium tracking-widest text-gray-600 py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((dia, i) => {
              if (dia === null) return <div key={`e-${i}`} />;
              const data = toDataStr(ano, mes, dia);
              const fech = fechPorData[data];
              const gastosNoDia = gastosPorData[data] ?? [];
              const totalGastos = gastosNoDia.reduce((s, g) => s + g.valor, 0);
              const fat = fech?.totalServicos ?? 0;
              const liquido = fat - totalGastos;
              const temMovimento = fech || totalGastos > 0;
              const eHoje = data === hoje;
              const sel = data === diaSel;
              const futuro = data > hoje;

              let borderCls = "border-transparent";
              if (sel) borderCls = "border-[#F5E6C8]/40";
              else if (eHoje && !fech) borderCls = "border-[#F5E6C8]/15";
              else if (fech && liquido > 0) borderCls = "border-green-900/50";
              else if (temMovimento && liquido <= 0) borderCls = "border-red-900/50";

              const valorLabel = fech
                ? (liquido >= 0 ? `+${brl(liquido).replace("R$ ", "R$")}` : `−${brl(Math.abs(liquido)).replace("R$ ", "R$")}`)
                : null;
              const corLabel = liquido >= 0 ? "text-green-400" : "text-red-400";

              return (
                <button key={data} onClick={() => setDiaSel(sel ? null : data)}
                  className={`relative flex flex-col items-center justify-center py-2 rounded border transition-all ${borderCls} ${sel ? "bg-[#1a1a1a]" : "hover:bg-[#0f0f0f]"} ${futuro && !sel ? "opacity-25" : ""}`}>
                  <span className={`text-xs font-medium ${eHoje ? "text-white" : fech ? "text-[#F5E6C8]" : "text-gray-500"}`}>{dia}</span>
                  {valorLabel && (
                    <span className={`text-[9px] font-medium leading-none mt-0.5 hidden sm:block ${corLabel}`}>{valorLabel}</span>
                  )}
                  {!fech && totalGastos > 0 && (
                    <span className="text-[9px] text-red-400 font-medium leading-none mt-0.5 hidden sm:block">−{brl(totalGastos).replace("R$ ", "R$")}</span>
                  )}
                  {eHoje && !fech && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#b8944a]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[#111]">
            {[
              { cls: "border-green-900/50", label: "LUCRO POSITIVO" },
              { cls: "border-red-900/50", label: "SALDO NEGATIVO / GASTO" },
              { cls: "border-[#F5E6C8]/15", label: "PENDENTE / ABERTO" },
              { cls: "border-yellow-800/50", label: "VENCIMENTO DE GASTO" },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 border rounded-sm ${cls}`} />
                <span className="text-[9px] font-medium tracking-widest text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
