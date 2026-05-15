"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, RefreshCw, MessageCircle,
  Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, Lock, Undo2,
  CalendarPlus, Ban, Unlock, LayoutGrid, List, Plus, TrendingUp,
  AlertCircle, AlertTriangle, Bell, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import type { Agendamento, AgendamentoStatus, FechamentoDia } from "@/lib/agendamentos-types";
import { parsePriceNum } from "@/lib/agendamentos-types";
import type { Barbeiro } from "@/lib/barbeiros-types";
import type { Item } from "@/lib/admin-items";
import { toDateKey } from "@/lib/date-utils";
import { HORARIO_FUNCIONAMENTO } from "@/lib/demo-data";

function parseDuracaoMin(duracao: string): number {
  const h = duracao.match(/(\d+)\s*h/i);
  const m = duracao.match(/(\d+)\s*min/i);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0) || 30;
}

function formatarData(dateKey: string) {
  return new Date(dateKey + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function gerarSlots(dateKey: string): string[] {
  const dow = new Date(dateKey + "T12:00:00").getDay();
  const turno = HORARIO_FUNCIONAMENTO[dow];
  if (!turno) return [];
  const slots: string[] = [];
  const [ih, im] = turno.inicio.split(":").map(Number);
  const [fh, fm] = turno.fim.split(":").map(Number);
  let cur = ih * 60 + im;
  const end = fh * 60 + fm;
  while (cur < end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
    cur += 30;
  }
  return slots;
}

const STATUS_STYLE: Record<AgendamentoStatus, string> = {
  pendente: "bg-yellow-900/30 text-yellow-400 border-yellow-700/50",
  confirmado: "bg-blue-900/30 text-blue-400 border-blue-700/50",
  cancelado: "bg-red-900/30 text-red-400 border-red-700/50",
  concluido: "bg-green-900/30 text-green-400 border-green-700/50",
  nao_compareceu: "bg-[#1a1a1a] text-gray-500 border-[#2d2d2d]",
};

const STATUS_LABEL: Record<AgendamentoStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
  nao_compareceu: "Não compareceu",
};

const SERVICOS_LISTA = [
  "Corte Clássico", "Barba Completa", "Combo Corte + Barba", "Coloração e Luzes", "Sobrancelha",
];

// ─── Calendário mensal rico ───────────────────────────────────────────────────

function CalendarioMensal({
  dataSelecionada,
  agendamentos,
  fechamentos,
  slotsBloqueados,
  onSelect,
}: {
  dataSelecionada: string;
  agendamentos: Agendamento[];
  fechamentos: FechamentoDia[];
  slotsBloqueados: string[];
  onSelect: (key: string) => void;
}) {
  const hoje = toDateKey(new Date());
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(dataSelecionada + "T12:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    const d = new Date(dataSelecionada + "T12:00:00");
    setViewDate({ year: d.getFullYear(), month: d.getMonth() });
  }, [dataSelecionada]);
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const { year, month } = viewDate;
  const nomeMes = new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const agsPorDia = agendamentos.reduce<Record<string, Agendamento[]>>((acc, a) => {
    if (a.status === "cancelado") return acc;
    acc[a.data] = [...(acc[a.data] ?? []), a];
    return acc;
  }, {});

  const fechPorDia = new Set(fechamentos.map((f) => f.data));
  const fatPorDia: Record<string, number> = {};
  fechamentos.forEach((f) => { fatPorDia[f.data] = f.totalServicos; });

  const primeiroDia = new Date(year, month, 1).getDay();
  const totalDias = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function navMes(delta: number) {
    setViewDate((v) => {
      let m = v.month + delta;
      let y = v.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  }

  const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 select-none">
      {/* cabeçalho */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navMes(-1)} className="p-1.5 text-gray-400 hover:text-[#b8944a] transition rounded-lg hover:bg-[#1a1a1a]">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-[#F5E6C8] capitalize">{nomeMes}</span>
        <button onClick={() => navMes(1)} className="p-1.5 text-gray-400 hover:text-[#b8944a] transition rounded-lg hover:bg-[#1a1a1a]">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* dias da semana */}
      <div className="grid grid-cols-7 mb-2">
        {DIAS_SEMANA.map((d, i) => (
          <div key={d} className={`text-center text-[10px] font-semibold py-1 ${i === 0 ? "text-red-500/60" : "text-gray-600"}`}>{d}</div>
        ))}
      </div>

      {/* células */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dia, i) => {
          if (!dia) return <div key={i} className="h-10" />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
          const selecionado = key === dataSelecionada;
          const isHoje = key === hoje;
          const ags = agsPorDia[key] ?? [];
          const temAg = ags.length > 0;
          const fechado = fechPorDia.has(key);
          const fat = fatPorDia[key];
          const isPast = key < hoje;
          const isHover = hoverKey === key;

          return (
            <div key={key} className="relative">
              <button
                onClick={() => onSelect(key)}
                onMouseEnter={() => setHoverKey(key)}
                onMouseLeave={() => setHoverKey(null)}
                className={`relative w-full h-10 flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                  ${selecionado
                    ? "bg-[#b8944a] text-[#0A0A0A] shadow-[0_0_12px_rgba(184,148,74,0.3)]"
                    : isHoje
                    ? "border-2 border-[#b8944a]/70 text-[#b8944a]"
                    : isPast && temAg
                    ? "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
                    : "text-gray-400 hover:bg-[#1a1a1a] hover:text-[#F5E6C8]"
                  }`}
              >
                <span className="font-bold leading-none">{dia}</span>
                {/* indicadores */}
                <div className="flex gap-0.5 mt-0.5 h-1 items-center">
                  {temAg && <span className={`w-1 h-1 rounded-full ${selecionado ? "bg-[#0A0A0A]/50" : "bg-[#b8944a]"}`} />}
                  {fechado && <span className={`w-1 h-1 rounded-full ${selecionado ? "bg-[#0A0A0A]/50" : "bg-green-500"}`} />}
                </div>
              </button>

              {/* tooltip hover */}
              {isHover && (temAg || fechado || fat) && !selecionado && (
                <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1e1e1e] border border-[#3d3d3d] rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl pointer-events-none">
                  {temAg && <p className="text-[#b8944a] font-semibold">{ags.length} agendamento{ags.length > 1 ? "s" : ""}</p>}
                  {fat !== undefined && <p className="text-green-400">R$ {fat.toFixed(2).replace(".", ",")} faturado</p>}
                  {fechado && <p className="text-green-300 flex items-center gap-1"><Lock size={8} /> Caixa fechado</p>}
                  {!fechado && isPast && temAg && <p className="text-red-400 flex items-center gap-1"><Unlock size={8} /> Caixa em aberto</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* legenda */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-[#b8944a]" /> agendamentos</div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> caixa fechado</div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-3 rounded border-2 border-[#b8944a]/60" /> hoje</div>
      </div>
    </div>
  );
}

// ─── modais ───────────────────────────────────────────────────────────────────

function Modal({ titulo, mensagem, confirmLabel, confirmClass, onConfirm, onCancel }: {
  titulo: string; mensagem: React.ReactNode; confirmLabel: string;
  confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <h3 className="font-bold text-[#F5E6C8]">{titulo}</h3>
        <div className="text-sm text-gray-400 leading-relaxed">{mensagem}</div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">Cancelar</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm text-white rounded transition ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function WalkInModal({ horario, dataSelecionada, barbeiros, onConfirm, onCancel }: {
  horario: string; dataSelecionada: string; barbeiros: Barbeiro[];
  onConfirm: (dados: { nome: string; telefone: string; servico: string; preco: string; barbeiroId?: string; barbeiroNome?: string }) => void;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState(SERVICOS_LISTA[0]);
  const [preco, setPreco] = useState("");
  const [barbeiroId, setBarbeiroId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dataLabel = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

  function handleConfirm() {
    if (!nome.trim() || submitting) return;
    setSubmitting(true);
    const b = barbeiros.find((x) => x.id === barbeiroId);
    onConfirm({ nome, telefone, servico, preco, barbeiroId: b?.id, barbeiroNome: b ? (b.apelido ?? b.nome) : undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-[#F5E6C8]">Novo agendamento presencial</h3>
          <p className="text-xs text-gray-500 mt-0.5">{dataLabel} às {horario}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Nome do cliente</label><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" className={inp} /></div>
          <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">WhatsApp (opcional)</label><input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="11999999999" className={inp} /></div>
          <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Serviço</label><select value={servico} onChange={(e) => setServico(e.target.value)} className={inp}>{SERVICOS_LISTA.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Preço (R$)</label><input value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="55" className={inp} /></div>
          {barbeiros.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Barbeiro</label>
              <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} className={inp}>
                <option value="">— Qualquer disponível —</option>
                {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.nome}{b.apelido ? ` (${b.apelido})` : ""}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">Cancelar</button>
          <button onClick={handleConfirm} disabled={!nome.trim() || submitting} className="px-4 py-2 text-sm text-[#0A0A0A] bg-[#b8944a] hover:bg-[#c9a84c] rounded transition disabled:opacity-40">{submitting ? "Salvando..." : "Confirmar"}</button>
        </div>
      </div>
    </div>
  );
}

function ReagendarModal({ ag, dataSelecionada, slotsLivres, onConfirm, onCancel }: {
  ag: Agendamento; dataSelecionada: string; slotsLivres: string[];
  onConfirm: (novaData: string, novoHorario: string) => void; onCancel: () => void;
}) {
  const [novaData, setNovaData] = useState(dataSelecionada);
  const [novoHorario, setNovoHorario] = useState(slotsLivres[0] ?? ag.horario);
  const [slotsLivresFetch, setSlotsLivresFetch] = useState<string[] | null>(null);
  const [buscandoSlots, setBuscandoSlots] = useState(false);
  const hojeKey = toDateKey(new Date());

  useEffect(() => {
    if (novaData === dataSelecionada) {
      setSlotsLivresFetch(null);
      return;
    }
    setBuscandoSlots(true);
    Promise.all([
      fetch(`/api/agendamentos?data=${novaData}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/slots?data=${novaData}`, { credentials: "include" }).then((r) => r.json()),
    ]).then(([ags, { bloqueados }]: [Agendamento[], { bloqueados: string[] }]) => {
      const ocupados = new Set([
        ...ags.filter((a) => a.id !== ag.id && a.status !== "cancelado").map((a) => a.horario),
        ...bloqueados,
      ]);
      const todos = gerarSlots(novaData);
      const minutosAgora = new Date().getHours() * 60 + new Date().getMinutes();
      setSlotsLivresFetch(todos.filter((s) => {
        if (ocupados.has(s)) return false;
        if (novaData === hojeKey) {
          const [h, m] = s.split(":").map(Number);
          return h * 60 + m > minutosAgora;
        }
        return true;
      }));
      setBuscandoSlots(false);
    }).catch(() => setBuscandoSlots(false));
  }, [novaData, dataSelecionada, ag.id, hojeKey]);

  const minutosAgora = new Date().getHours() * 60 + new Date().getMinutes();
  const slotsParaData = novaData === dataSelecionada
    ? slotsLivres.filter((s) => {
        if (novaData !== hojeKey) return true;
        const [h, m] = s.split(":").map(Number);
        return h * 60 + m > minutosAgora;
      })
    : (slotsLivresFetch ?? []);

  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div><h3 className="font-bold text-[#F5E6C8]">Reagendar</h3><p className="text-xs text-gray-500 mt-0.5">{ag.nome} · {ag.servico}</p></div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Nova data</label><input type="date" value={novaData} onChange={(e) => { setNovaData(e.target.value); setNovoHorario(""); }} min={toDateKey(new Date())} className={inp} /></div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Novo horário</label>
            {buscandoSlots ? (
              <p className="text-xs text-gray-500">Verificando disponibilidade...</p>
            ) : slotsParaData.length > 0 ? (
              <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto">
                {slotsParaData.map((s) => (
                  <button key={s} onClick={() => setNovoHorario(s)} className={`text-xs py-1.5 rounded border transition ${novoHorario === s ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]" : "bg-[#0A0A0A] text-gray-300 border-[#2d2d2d] hover:border-[#b8944a]"}`}>{s}</button>
                ))}
              </div>
            ) : <p className="text-xs text-gray-500">Nenhum slot disponível neste dia.</p>}
          </div>
        </div>
        <p className="text-xs text-[#b8944a] bg-[#b8944a]/10 rounded px-3 py-2">O cliente receberá uma mensagem no WhatsApp com o novo horário.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">Cancelar</button>
          <button onClick={() => { if (novoHorario) onConfirm(novaData, novoHorario); }} disabled={!novoHorario || buscandoSlots} className="px-4 py-2 text-sm text-white bg-[#1a1a1a] hover:bg-[#2d2d2d] border border-[#3d3d3d] rounded transition disabled:opacity-40">Reagendar e notificar</button>
        </div>
      </div>
    </div>
  );
}

type ModalState = { tipo: "concluir" | "excluir" | "fechar_caixa" | "bloquear"; id?: string; horario?: string } | null;

export default function AgendamentosAdminPage() {
  const hoje = new Date();
  const hojeKey = toDateKey(hoje);
  const [dataSelecionada, setDataSelecionada] = useState(hojeKey);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editLinhas, setEditLinhas] = useState<{ servico: string; preco: string }[]>([]);
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);
  const [fechandoCaixa, setFechandoCaixa] = useState(false);
  const [caixaFechado, setCaixaFechado] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [slotsBloqueados, setSlotsBloqueados] = useState<string[]>([]);
  const [walkInHorario, setWalkInHorario] = useState<string | null>(null);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Item[]>([]);
  const [reagendarAg, setReagendarAg] = useState<Agendamento | null>(null);
  const [notificacaoLink, setNotificacaoLink] = useState<string | null>(null);
  const [aba, setAba] = useState<"lista" | "grade">("lista");
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [alertasExpandidos, setAlertasExpandidos] = useState<Set<string>>(new Set());

  function toggleAlerta(key: string) {
    setAlertasExpandidos((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  useEffect(() => {
    if (!scrollTarget || carregando) return;
    const el = document.getElementById(`ag-${scrollTarget}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-1", "ring-[#b8944a]");
      setTimeout(() => el.classList.remove("ring-1", "ring-[#b8944a]"), 2000);
    }
    setScrollTarget(null);
  }, [scrollTarget, carregando]);

  function irParaAgendamento(ag: Agendamento) {
    setDataSelecionada(ag.data);
    setAba("lista");
    setEditandoId(null);
    setScrollTarget(ag.id);
  }

  function tempoAtras(ts: number): string {
    const diff = Date.now() - ts;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `há ${h}h${m > 0 ? ` ${m}min` : ""}`;
    return `há ${m}min`;
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [resAgs, resFech, resBloq] = await Promise.all([
      fetch("/api/agendamentos", { credentials: "include" }),
      fetch("/api/fechamento", { credentials: "include" }),
      fetch(`/api/slots?data=${dataSelecionada}`, { credentials: "include" }),
    ]);
    const agsData = await resAgs.json();
    const fechsData = await resFech.json();
    const { bloqueados } = await resBloq.json();
    const ags: Agendamento[] = Array.isArray(agsData) ? agsData : [];
    const fechs: FechamentoDia[] = Array.isArray(fechsData) ? fechsData : [];
    setAgendamentos(ags);
    setFechamentos(fechs);
    setSlotsBloqueados(bloqueados);
    setCaixaFechado(fechs.some((f) => f.data === dataSelecionada));
    setCarregando(false);

    // marca novos agendamentos como visualizados em background
    const temNaoVisualizados = ags.some((a) => a.visualizadoAdmin === false && a.status !== "cancelado");
    if (temNaoVisualizados) {
      fetch("/api/admin/agendamentos-visualizar", { credentials: "include", method: "POST" })
        .then(() => setAgendamentos((prev) => prev.map((a) => ({ ...a, visualizadoAdmin: true }))))
        .catch(() => {});
    }
  }, [dataSelecionada]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    fetch("/api/admin/barbeiros", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBarbeiros(d.barbeiros ?? []));
    fetch("/api/publico/servicos")
      .then((r) => r.json())
      .then((d) => setServicos(d.items ?? []));
  }, []);

  const agsDia = agendamentos.filter((a) => a.data === dataSelecionada).sort((a, b) => a.horario.localeCompare(b.horario));
  const concluidos = agsDia.filter((a) => a.status === "concluido");
  const totalDia = concluidos.reduce((s, a) => s + parsePriceNum(a.preco), 0);
  const todosSlotsDia = gerarSlots(dataSelecionada);
  const horariosOcupados = new Set(agsDia.map((a) => a.horario));
  const slotsLivresDia = todosSlotsDia.filter((s) => !horariosOcupados.has(s) && !slotsBloqueados.includes(s));

  const ehHoje = dataSelecionada === hojeKey;
  const ehFuturo = dataSelecionada > hojeKey;
  const diaFechado = todosSlotsDia.length === 0;

  const dataLabel = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const diaSemana = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long" });

  async function atualizarStatus(id: string, status: AgendamentoStatus) {
    setProcessando(id);
    const res = await fetch(`/api/agendamentos/${id}`, { credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await res.json();
    setAgendamentos((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setProcessando(null);
    if (data.whatsappLink) window.open(data.whatsappLink, "_blank");
  }

  async function salvarEdicao(id: string) {
    const linhas = editLinhas.filter((l) => l.servico.trim());
    if (linhas.length === 0) return;
    const servicoFinal = linhas.map((l) => l.servico).join(" + ");
    const precoTotal = linhas.reduce((s, l) => s + parsePriceNum(l.preco), 0);
    const precoFinal = precoTotal > 0 ? precoTotal.toFixed(2).replace(".", ",") : "";
    setProcessando(id);
    await fetch(`/api/agendamentos/${id}`, { credentials: "include", method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ servico: servicoFinal, preco: precoFinal }) });
    setAgendamentos((prev) => prev.map((a) => a.id === id ? { ...a, servico: servicoFinal, preco: precoFinal } : a));
    setEditandoId(null);
    setProcessando(null);
  }

  async function excluir(id: string) {
    await fetch(`/api/agendamentos/${id}`, { credentials: "include", method: "DELETE" });
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
  }

  async function fecharCaixa() {
    if (caixaFechado) return;
    setFechandoCaixa(true);
    const res = await fetch("/api/fechamento", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: dataSelecionada }) });
    if (res.ok || res.status === 409) setCaixaFechado(true);
    setFechandoCaixa(false);
  }

  async function toggleBloquearSlot(horario: string) {
    const jaBloqueado = slotsBloqueados.includes(horario);
    await fetch("/api/slots", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: dataSelecionada, horario, acao: jaBloqueado ? "desbloquear" : "bloquear" }) });
    setSlotsBloqueados((prev) => jaBloqueado ? prev.filter((s) => s !== horario) : [...prev, horario]);
  }

  async function criarWalkIn(dados: { nome: string; telefone: string; servico: string; preco: string; barbeiroId?: string; barbeiroNome?: string }) {
    const res = await fetch("/api/agendamentos", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dados, telefone: dados.telefone || "00000000000", data: dataSelecionada, horario: walkInHorario }) });
    const { id } = await res.json();
    await fetch(`/api/agendamentos/${id}`, { credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "confirmado" }) });
    setWalkInHorario(null);
    carregar();
  }

  async function reagendar(novaData: string, novoHorario: string) {
    if (!reagendarAg) return;
    const res = await fetch(`/api/agendamentos/${reagendarAg.id}`, { credentials: "include", method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: novaData, horario: novoHorario }) });
    const data = await res.json();
    setReagendarAg(null);
    carregar();
    if (data.whatsappLink) setNotificacaoLink(data.whatsappLink);
  }

  function confirmarModal() {
    if (!modal) return;
    if (modal.tipo === "concluir" && modal.id) atualizarStatus(modal.id, "concluido");
    if (modal.tipo === "excluir" && modal.id) excluir(modal.id);
    if (modal.tipo === "fechar_caixa") fecharCaixa();
    if (modal.tipo === "bloquear" && modal.horario) toggleBloquearSlot(modal.horario);
    setModal(null);
  }

  const modalConfig = {
    concluir: { titulo: "Marcar como concluído?", mensagem: "Será incluído no caixa do dia.", confirmLabel: "Concluir", confirmClass: "bg-green-700 hover:bg-green-600" },
    excluir: { titulo: "Remover agendamento?", mensagem: "Esta ação remove o agendamento da lista.", confirmLabel: "Remover", confirmClass: "bg-red-600 hover:bg-red-500" },
    fechar_caixa: { titulo: "Fechar o caixa do dia?", mensagem: `${concluidos.length} serviços · R$ ${totalDia.toFixed(2).replace(".", ",")}`, confirmLabel: "Fechar caixa", confirmClass: "bg-[#b8944a] hover:bg-[#c9a84c] text-[#0A0A0A]" },
    bloquear: {
      titulo: modal?.horario && slotsBloqueados.includes(modal.horario) ? "Desbloquear horário?" : "Bloquear horário?",
      mensagem: modal?.horario && slotsBloqueados.includes(modal.horario) ? `Horário ${modal.horario} voltará a estar disponível.` : `Horário ${modal?.horario} ficará indisponível para clientes.`,
      confirmLabel: modal?.horario && slotsBloqueados.includes(modal.horario) ? "Desbloquear" : "Bloquear",
      confirmClass: "bg-[#2d2d2d] hover:bg-[#3d3d3d]",
    },
  };

  const cardDark = "bg-[#111] border border-[#2d2d2d] rounded-xl";
  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-2 py-1 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">
      {modal && <Modal {...modalConfig[modal.tipo]} onConfirm={confirmarModal} onCancel={() => setModal(null)} />}
      {walkInHorario && <WalkInModal horario={walkInHorario} dataSelecionada={dataSelecionada} barbeiros={barbeiros} onConfirm={criarWalkIn} onCancel={() => setWalkInHorario(null)} />}
      {reagendarAg && <ReagendarModal ag={reagendarAg} dataSelecionada={dataSelecionada} slotsLivres={slotsLivresDia} onConfirm={reagendar} onCancel={() => setReagendarAg(null)} />}
      {notificacaoLink && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#1a2a1a] border border-green-700/60 text-green-300 rounded-xl px-4 py-3 shadow-xl max-w-xs">
          <MessageCircle size={18} className="shrink-0 text-green-400" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Reagendamento salvo</span>
            <span className="text-xs text-green-400/70">Notifique o cliente pelo WhatsApp</span>
          </div>
          <div className="flex gap-2 ml-auto">
            <a href={notificacaoLink} target="_blank" rel="noreferrer" onClick={() => setNotificacaoLink(null)} className="text-xs bg-green-700 hover:bg-green-600 text-white rounded px-2 py-1 transition">Enviar</a>
            <button onClick={() => setNotificacaoLink(null)} className="text-xs text-gray-500 hover:text-gray-300 transition"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Agendamentos</h1>
        <button onClick={carregar} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#b8944a] transition">
          <RefreshCw size={14} className={carregando ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {/* ── Alertas de agendamentos ───────────────────────────────────────────── */}
      {(() => {
        const agora = new Date();
        const agoraMs = agora.getTime();
        const hoje = toDateKey(agora);

        const naoVisualizados = agendamentos.filter((a) => a.visualizadoAdmin === false && a.status !== "cancelado");
        const proximos = agendamentos.filter((a) => {
          if (a.data !== hoje || a.status === "cancelado" || a.status === "concluido") return false;
          const [h, m] = a.horario.split(":").map(Number);
          const diff = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h, m).getTime() - agoraMs;
          return diff > 0 && diff <= 30 * 60 * 1000;
        });
        const atrasados = agendamentos.filter((a) => {
          if (a.data !== hoje || (a.status !== "pendente" && a.status !== "confirmado")) return false;
          const [h, m] = a.horario.split(":").map(Number);
          return agoraMs > new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h, m).getTime() + 10 * 60 * 1000;
        });
        const aguardandoLongos = agendamentos
          .filter((a) => a.status === "pendente" && a.criadoEm && agoraMs - a.criadoEm > 2 * 60 * 60 * 1000)
          .sort((a, b) => a.criadoEm - b.criadoEm);

        const temAlerta = atrasados.length > 0 || proximos.length > 0 || naoVisualizados.length > 0 || aguardandoLongos.length > 0;
        if (!temAlerta) return null;

        return (
          <div className="flex flex-col gap-1.5">

            {/* Atrasados com horário passado */}
            {atrasados.length > 0 && (
              <div className="rounded-lg border bg-red-950/50 border-red-800/50 overflow-hidden">
                <button onClick={() => toggleAlerta("atrasados")}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-red-300 hover:bg-red-900/20 transition">
                  <AlertCircle size={13} className="shrink-0" />
                  <span className="flex-1 text-left">{atrasados.length} atendimento{atrasados.length > 1 ? "s" : ""} com horário passado sem conclusão</span>
                  <ChevronDown size={13} className={`shrink-0 transition-transform ${alertasExpandidos.has("atrasados") ? "rotate-180" : ""}`} />
                </button>
                {alertasExpandidos.has("atrasados") && (
                  <div className="border-t border-red-900/40 divide-y divide-red-900/30">
                    {atrasados.map((a) => (
                      <button key={a.id} onClick={() => irParaAgendamento(a)}
                        className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-red-900/20 transition group">
                        <span className="text-xs font-bold text-red-400/80 w-10 shrink-0">{a.horario}</span>
                        <span className="text-xs text-red-200 font-medium flex-1 truncate">{a.nome}</span>
                        <span className="text-[10px] text-red-400/60 truncate max-w-[120px]">{a.servico}</span>
                        <span className="text-[10px] text-red-500/50 shrink-0 group-hover:text-red-300 transition">ver →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Próximos em 30min */}
            {proximos.map((a) => {
              const [h, m] = a.horario.split(":").map(Number);
              const mins = Math.round((new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), h, m).getTime() - agoraMs) / 60000);
              const nivel = mins <= 10 ? "vermelho" : "laranja";
              const style = nivel === "vermelho"
                ? "bg-red-950/50 border-red-800/50 text-red-300 hover:bg-red-900/30"
                : "bg-orange-950/40 border-orange-700/40 text-orange-300 hover:bg-orange-900/20";
              return (
                <button key={a.id} onClick={() => irParaAgendamento(a)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs font-medium transition text-left group ${style}`}>
                  <Clock size={13} className="shrink-0" />
                  <span className="flex-1">{a.nome} — {a.servico} em <strong>{mins} min</strong> ({a.horario})</span>
                  <span className="text-[10px] opacity-50 group-hover:opacity-100 transition shrink-0">ver →</span>
                </button>
              );
            })}

            {/* Novos não visualizados */}
            {naoVisualizados.length > 0 && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border bg-orange-950/40 border-orange-700/40 text-orange-300 text-xs font-medium">
                <Bell size={13} className="shrink-0" />
                {naoVisualizados.length} novo{naoVisualizados.length > 1 ? "s" : ""} agendamento{naoVisualizados.length > 1 ? "s" : ""} aguardando confirmação
              </div>
            )}

            {/* Pendentes há mais de 2h */}
            {aguardandoLongos.length > 0 && atrasados.length === 0 && (
              <div className="rounded-lg border bg-yellow-950/40 border-yellow-700/40 overflow-hidden">
                <button onClick={() => toggleAlerta("aguardando")}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-yellow-300 hover:bg-yellow-900/20 transition">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span className="flex-1 text-left">{aguardandoLongos.length} pendente{aguardandoLongos.length > 1 ? "s" : ""} há mais de 2h sem resposta</span>
                  <ChevronDown size={13} className={`shrink-0 transition-transform ${alertasExpandidos.has("aguardando") ? "rotate-180" : ""}`} />
                </button>
                {alertasExpandidos.has("aguardando") && (
                  <div className="border-t border-yellow-900/40 divide-y divide-yellow-900/30">
                    {aguardandoLongos.map((a) => (
                      <button key={a.id} onClick={() => irParaAgendamento(a)}
                        className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-yellow-900/20 transition group">
                        <div className="shrink-0 flex flex-col items-start w-28">
                          <span className="text-xs font-bold text-yellow-400/80">
                            {new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {a.horario}
                          </span>
                          <span className="text-[10px] text-yellow-600">{tempoAtras(a.criadoEm)}</span>
                        </div>
                        <span className="text-xs text-yellow-200 font-medium flex-1 truncate">{a.nome}</span>
                        <span className="text-[10px] text-yellow-400/60 truncate max-w-[120px]">{a.servico}</span>
                        <span className="text-[10px] text-yellow-500/50 shrink-0 group-hover:text-yellow-300 transition">ver →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        );
      })()}

      {/* ── KPIs do dia selecionado ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${cardDark} p-4`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">Agendamentos</p>
          <p className="text-2xl font-bold text-[#F5E6C8]">{agsDia.length}</p>
          <p className="text-xs text-gray-500 mt-1 capitalize truncate">{diaSemana}, {new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
        </div>
        <div className={`${cardDark} p-4`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">Horários livres</p>
          <p className="text-2xl font-bold text-[#F5E6C8]">{slotsLivresDia.length}</p>
          <p className="text-xs text-gray-500 mt-1">de {todosSlotsDia.length} no dia</p>
        </div>
        <div className={`${cardDark} p-4`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">Faturado</p>
          <p className="text-2xl font-bold text-green-400">R$ {totalDia.toFixed(2).replace(".", ",")}</p>
          <p className="text-xs text-gray-500 mt-1">{concluidos.length} concluído{concluidos.length !== 1 ? "s" : ""}</p>
        </div>
        <div className={`${cardDark} p-4 flex flex-col justify-between`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">Caixa</p>
          <p className={`text-sm font-bold flex items-center gap-1.5 ${caixaFechado ? "text-green-400" : "text-gray-400"}`}>
            {caixaFechado ? <><Lock size={13} /> Fechado</> : <><Unlock size={13} /> Em aberto</>}
          </p>
          {!ehFuturo && (
            <Link href={`/admin/financeiro?dia=${dataSelecionada}#caixa`}
              className="mt-2 text-[10px] font-bold tracking-widest uppercase text-[#b8944a] hover:underline flex items-center gap-1">
              <TrendingUp size={10} /> Ver no financeiro
            </Link>
          )}
        </div>
      </div>

      {/* ── Calendário + Lista lado a lado ───────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* calendário */}
        <div className="w-full lg:w-[420px] shrink-0">
          <CalendarioMensal
            dataSelecionada={dataSelecionada}
            agendamentos={agendamentos}
            fechamentos={fechamentos}
            slotsBloqueados={slotsBloqueados}
            onSelect={(key) => { setDataSelecionada(key); setEditandoId(null); }}
          />
        </div>

        {/* Lista do dia — self-stretch + absolute para igualar altura do calendário */}
        <div className="flex-1 self-stretch relative min-h-0">
          {diaFechado ? (
            <div className={`${cardDark} text-sm text-gray-500 py-16 text-center h-full`}>Barbearia fechada neste dia.</div>
          ) : (
            <div className={`absolute inset-0 ${cardDark} overflow-hidden flex flex-col`}>
              {/* cabeçalho */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#1a1a1a] gap-2 flex-wrap shrink-0">
                <div>
                  <p className="text-sm font-bold text-[#F5E6C8] capitalize flex items-center gap-2"><List size={14} /> {diaSemana}, {dataLabel}</p>
                  <p className="text-xs text-gray-500">
                    {ehHoje && <span className="text-[#b8944a] font-medium">Hoje · </span>}
                    {agsDia.length === 0 ? "Nenhum agendamento" : `${agsDia.length} agendamento${agsDia.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>

              {/* conteúdo com scroll */}
              <div className="overflow-y-auto flex-1 min-h-0">
                {carregando ? (
                  <div className="text-sm text-gray-500 py-12 text-center">Carregando...</div>
                ) : agsDia.length === 0 ? (
                  <div className="text-sm text-gray-500 py-12 text-center">
                    {ehFuturo ? "Nenhum agendamento para este dia ainda." : "Nenhum agendamento neste dia."}
                  </div>
                ) : (
                  <div className="divide-y divide-[#1a1a1a]">
                    {agsDia.map((ag) => {
                      const editando = editandoId === ag.id;
                      const ocupado = processando === ag.id;
                      const ehConcluido = ag.status === "concluido";
                      const finalizado = ehConcluido || ag.status === "nao_compareceu" || ag.status === "cancelado";

                      const [hh, mm] = ag.horario.split(":").map(Number);
                      const duracaoMin = ag.duracaoMin
                        ?? (() => {
                          const nomes = ag.servico.split("+").map((s) => s.trim().toLowerCase());
                          return nomes.reduce((total, nome) => {
                            const svc = servicos.find((s) => s.titulo.toLowerCase() === nome);
                            return total + (svc ? parseDuracaoMin(svc.duracao) : 30);
                          }, 0);
                        })();
                      const fimMin = hh * 60 + mm + duracaoMin;
                      const horarioFim = `${String(Math.floor(fimMin / 60)).padStart(2, "0")}:${String(fimMin % 60).padStart(2, "0")}`;

                      return (
                        <div key={ag.id} id={`ag-${ag.id}`} className={`px-4 py-4 transition rounded-lg ${finalizado && !ehConcluido ? "opacity-50" : ""}`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-20 pt-0.5">
                              <p className="text-sm font-bold text-[#F5E6C8]">{ag.horario} – {horarioFim}</p>
                            </div>
                            <div className="flex-1 min-w-0 flex gap-2">
                              <div className="flex-1 min-w-0">
                              {editando ? (
                                <div className="mt-2 flex flex-col gap-2">
                                  {editLinhas.map((linha, idx) => (
                                    <div key={idx} className="flex gap-2 items-center flex-wrap">
                                      <select value={linha.servico} onChange={(e) => setEditLinhas((prev) => prev.map((l, i) => i === idx ? { ...l, servico: e.target.value } : l))} className={inp}>{SERVICOS_LISTA.map((s) => <option key={s}>{s}</option>)}</select>
                                      <input value={linha.preco} onChange={(e) => setEditLinhas((prev) => prev.map((l, i) => i === idx ? { ...l, preco: e.target.value } : l))} placeholder="Preço" className={`${inp} w-24`} />
                                      {editLinhas.length > 1 && <button onClick={() => setEditLinhas((prev) => prev.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-300 rounded transition"><X size={13} /></button>}
                                    </div>
                                  ))}
                                  {editLinhas.length > 1 && <p className="text-xs text-[#b8944a] font-medium">Total: R$ {editLinhas.reduce((s, l) => s + parsePriceNum(l.preco), 0).toFixed(2).replace(".", ",")}</p>}
                                  <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => setEditLinhas((prev) => [...prev, { servico: SERVICOS_LISTA[0], preco: "" }])} className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded hover:bg-[#b8944a]/10 transition"><Plus size={11} /> Serviço</button>
                                    <button onClick={() => salvarEdicao(ag.id)} disabled={ocupado} className="flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 border border-green-700/50 rounded text-xs hover:bg-green-900/50 transition"><Check size={12} /> Salvar</button>
                                    <button onClick={() => setEditandoId(null)} className="flex items-center gap-1 px-2 py-1 border border-[#2d2d2d] text-gray-400 rounded text-xs hover:border-[#b8944a] transition"><X size={12} /> Cancelar</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-[#F5E6C8]">{ag.servico}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Cliente: <span className="text-gray-400">{ag.nome}</span></p>
                                  {ag.telefone && ag.telefone !== "00000000000" && (
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      <a href={`https://wa.me/55${ag.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition">{ag.telefone}</a>
                                    </p>
                                  )}
                                  {ag.barbeiroNome && (
                                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-[#2d2d2d] text-gray-300 border border-[#3d3d3d] rounded-full">✂️ {ag.barbeiroNome}</span>
                                  )}
                                  {ag.cupom && (
                                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-[#b8944a]/10 text-[#b8944a] border border-[#b8944a]/30 rounded-full font-mono">
                                      🏷️ {ag.cupom}{ag.desconto ? ` −R$ ${ag.desconto.toFixed(2).replace(".", ",")}` : ""}
                                    </span>
                                  )}
                                  {ag.historico && ag.historico.length > 0 && (
                                    <details className="mt-2">
                                      <summary className="text-[10px] text-gray-600 cursor-pointer hover:text-gray-400 transition select-none">Histórico ({ag.historico.length})</summary>
                                      <div className="mt-1.5 flex flex-col gap-0.5 pl-2 border-l border-[#2d2d2d]">
                                        {ag.historico.map((h, i) => (
                                          <p key={i} className="text-[10px] text-gray-500">
                                            <span className="text-gray-400">{new Date(h.ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                                            {" · "}{h.acao}{" · "}<span className="text-gray-600">{h.adminId}</span>
                                          </p>
                                        ))}
                                      </div>
                                    </details>
                                  )}
                                  {!caixaFechado && (
                                    <div className="flex items-center gap-1 flex-wrap mt-3">
                                      {ag.status === "pendente" && (
                                        <button onClick={() => atualizarStatus(ag.id, "confirmado")} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-400 border border-blue-700/40 rounded-lg hover:bg-blue-900/20 transition"><Check size={11} /> Confirmar</button>
                                      )}
                                      {(ag.status === "confirmado" || ag.status === "pendente") && (
                                        <button onClick={() => setModal({ tipo: "concluir", id: ag.id })} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1 text-xs text-green-400 border border-green-700/40 rounded-lg hover:bg-green-900/20 transition"><CheckCircle size={11} /> Concluir</button>
                                      )}
                                      {!finalizado && (
                                        <button onClick={() => setReagendarAg(ag)} className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded-lg hover:bg-[#b8944a]/10 transition"><CalendarPlus size={11} /> Reagendar</button>
                                      )}
                                      {(ag.status === "confirmado" || ag.status === "pendente") && (
                                        <button onClick={() => atualizarStatus(ag.id, "nao_compareceu")} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition"><Clock size={11} /> Não compareceu</button>
                                      )}
                                      {(ehConcluido || ag.status === "nao_compareceu") && (
                                        <button onClick={() => atualizarStatus(ag.id, "confirmado")} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition"><Undo2 size={11} /> Desfazer</button>
                                      )}
                                      {!finalizado && (
                                        <button onClick={() => { setEditandoId(ag.id); const srvs = ag.servico.split(" + "); const precos = ag.preco.split(" + "); setEditLinhas(srvs.map((s, i) => ({ servico: s.trim(), preco: precos[i]?.trim() ?? "" }))); }} className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg transition"><Pencil size={13} /></button>
                                      )}
                                      <button onClick={() => setModal({ tipo: "excluir", id: ag.id })} className="p-1.5 text-red-500/50 hover:text-red-400 rounded-lg transition"><Trash2 size={13} /></button>
                                    </div>
                                  )}
                                </>
                              )}
                              </div>

                              {/* coluna direita: preço + status */}
                              <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                                {ag.preco && <span className="text-xs font-bold text-[#b8944a]">R$ {ag.preco}</span>}
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_STYLE[ag.status]}`}>{STATUS_LABEL[ag.status]}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* rodapé */}
              {!ehFuturo && (
                <div className="px-4 py-2 border-t border-[#1a1a1a] flex items-center justify-between gap-3 flex-wrap shrink-0">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    {caixaFechado && <Lock size={11} className="text-green-400" />}
                    {caixaFechado ? <span className="text-green-400">Caixa fechado · </span> : null}
                    {concluidos.length} concluídos · R$ {totalDia.toFixed(2).replace(".", ",")} faturados
                  </p>
                  <Link href={`/admin/financeiro?dia=${dataSelecionada}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#b8944a]/40 text-[#b8944a] text-xs font-bold hover:border-[#b8944a] hover:bg-[#b8944a]/5 transition rounded-lg">
                    <TrendingUp size={12} /> Ir pro caixa
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>{/* fim flex-row */}

      {/* ── Grade de horários ─────────────────────────────────────────────────── */}
      {!diaFechado && (
        <div className={`${cardDark} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-[#1a1a1a]">
            <p className="text-sm font-bold text-[#F5E6C8] flex items-center gap-2"><LayoutGrid size={14} /> Grade de horários</p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{diaSemana}, {dataLabel} · clique para agendar ou bloquear</p>
          </div>
          <div className="overflow-y-auto max-h-[480px] divide-y divide-[#1a1a1a]">
            {todosSlotsDia.map((slot) => {
              const agsNoSlot = agsDia.filter((a) => a.horario === slot && a.status !== "cancelado");
              const bloqueado = slotsBloqueados.includes(slot);
              const totalBarbeiros = barbeiros.length || 1;
              const cheio = !bloqueado && agsNoSlot.length >= totalBarbeiros;
              const livre = agsNoSlot.length === 0 && !bloqueado;
              return (
                <div key={slot} className={`flex gap-3 px-4 py-3 ${bloqueado ? "bg-[#0A0A0A]" : cheio ? "bg-red-950/10" : ""}`}>
                  <div className="flex-shrink-0 w-12 pt-1">
                    <span className="text-sm font-bold text-gray-500">{slot}</span>
                    {!bloqueado && (
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {agsNoSlot.length}/{totalBarbeiros}
                        {cheio && <span className="text-red-500/80 ml-1">cheio</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    {bloqueado ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center gap-1.5"><Ban size={13} className="text-red-500/70" /> Bloqueado</span>
                        {!caixaFechado && <button onClick={() => setModal({ tipo: "bloquear", horario: slot })} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition"><Unlock size={12} /> Desbloquear</button>}
                      </div>
                    ) : livre ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-500/80 font-medium">Disponível</span>
                        {!caixaFechado && (
                          <div className="flex gap-1">
                            <button onClick={() => setWalkInHorario(slot)} className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded hover:bg-[#b8944a]/10 transition"><CalendarPlus size={12} /> Agendar</button>
                            <button onClick={() => setModal({ tipo: "bloquear", horario: slot })} className="p-1.5 text-gray-500 hover:text-red-400 rounded transition" title="Bloquear"><Ban size={13} /></button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {agsNoSlot.map((ag) => {
                          const editando = editandoId === ag.id;
                          const ocupado = processando === ag.id;
                          const ehConcluido = ag.status === "concluido";
                          const finalizado = ehConcluido || ag.status === "nao_compareceu" || ag.status === "cancelado";
                          return (
                            <div key={ag.id} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-3 flex flex-col gap-2">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  {editando ? (
                                    <div className="flex flex-col gap-2">
                                      {editLinhas.map((linha, idx) => (
                                        <div key={idx} className="flex gap-2 items-center flex-wrap">
                                          <select value={linha.servico} onChange={(e) => setEditLinhas((prev) => prev.map((l, i) => i === idx ? { ...l, servico: e.target.value } : l))} className={inp}>{SERVICOS_LISTA.map((s) => <option key={s}>{s}</option>)}</select>
                                          <input value={linha.preco} onChange={(e) => setEditLinhas((prev) => prev.map((l, i) => i === idx ? { ...l, preco: e.target.value } : l))} placeholder="Preço" className={`${inp} w-24`} />
                                          {editLinhas.length > 1 && <button onClick={() => setEditLinhas((prev) => prev.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-300 rounded transition"><X size={13} /></button>}
                                        </div>
                                      ))}
                                      {editLinhas.length > 1 && <p className="text-xs text-[#b8944a]">Total: R$ {editLinhas.reduce((s, l) => s + parsePriceNum(l.preco), 0).toFixed(2).replace(".", ",")}</p>}
                                      <div className="flex gap-2 flex-wrap">
                                        <button onClick={() => setEditLinhas((prev) => [...prev, { servico: SERVICOS_LISTA[0], preco: "" }])} className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded hover:bg-[#b8944a]/10 transition"><Plus size={11} /> Serviço</button>
                                        <button onClick={() => salvarEdicao(ag.id)} disabled={ocupado} className="flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 border border-green-700/50 rounded text-xs hover:bg-green-900/50 transition"><Check size={12} /> Salvar</button>
                                        <button onClick={() => setEditandoId(null)} className="flex items-center gap-1 px-2 py-1 border border-[#2d2d2d] text-gray-400 rounded text-xs hover:border-[#b8944a] transition"><X size={12} /> Cancelar</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm font-semibold text-[#F5E6C8] truncate">{ag.nome}</p>
                                      <p className="text-xs text-gray-500 truncate">✂️ {ag.servico}{ag.barbeiroNome ? ` · ${ag.barbeiroNome}` : ""}</p>
                                      {ag.telefone && ag.telefone !== "00000000000" && (
                                        <a href={`https://wa.me/55${ag.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 hover:text-green-400 transition truncate block">{ag.telefone}</a>
                                      )}
                                    </>
                                  )}
                                </div>
                                {!editando && (
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    {ag.preco && <span className="text-xs font-bold text-[#b8944a]">R$ {ag.preco}</span>}
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_STYLE[ag.status]}`}>{STATUS_LABEL[ag.status]}</span>
                                  </div>
                                )}
                              </div>
                              {!caixaFechado && !editando && (
                                <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-[#1a1a1a]">
                                  {ag.status === "pendente" && <button onClick={() => atualizarStatus(ag.id, "confirmado")} disabled={ocupado} className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 border border-blue-700/40 rounded-lg hover:bg-blue-900/20 transition"><Check size={11} /> Confirmar</button>}
                                  {(ag.status === "confirmado" || ag.status === "pendente") && <button onClick={() => setModal({ tipo: "concluir", id: ag.id })} disabled={ocupado} className="flex items-center gap-1 px-2 py-1 text-xs text-green-400 border border-green-700/40 rounded-lg hover:bg-green-900/20 transition"><CheckCircle size={11} /> Concluir</button>}
                                  {!finalizado && <button onClick={() => setReagendarAg(ag)} className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded-lg hover:bg-[#b8944a]/10 transition"><CalendarPlus size={11} /> Reagendar</button>}
                                  {(ag.status === "confirmado" || ag.status === "pendente") && <button onClick={() => atualizarStatus(ag.id, "nao_compareceu")} disabled={ocupado} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition"><Clock size={11} /> Não compareceu</button>}
                                  {(ehConcluido || ag.status === "nao_compareceu") && <button onClick={() => atualizarStatus(ag.id, "confirmado")} disabled={ocupado} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition"><Undo2 size={11} /> Desfazer</button>}
                                  {!finalizado && <button onClick={() => { setEditandoId(ag.id); const srvs = ag.servico.split(" + "); const precos = ag.preco.split(" + "); setEditLinhas(srvs.map((s, i) => ({ servico: s.trim(), preco: precos[i]?.trim() ?? "" }))); }} className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg transition"><Pencil size={13} /></button>}
                                  <button onClick={() => setModal({ tipo: "excluir", id: ag.id })} className="p-1.5 text-red-500/50 hover:text-red-400 rounded-lg transition ml-auto"><Trash2 size={13} /></button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {!cheio && !caixaFechado && (
                          <button onClick={() => setWalkInHorario(slot)} className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded hover:bg-[#b8944a]/10 transition self-start"><CalendarPlus size={12} /> Adicionar</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
