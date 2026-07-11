"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  IconAdjustments, IconAlertCircle, IconAlertTriangle, IconArrowBackUp, IconBan, IconBell, IconCalendar, IconCalendarCheck, IconCalendarPlus, IconCalendarX, IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconCircleCheck, IconCircleX, IconClock, IconCoffee, IconLayoutGrid, IconList, IconLock, IconLockOpen, IconMessageCircle, IconPencil, IconPlus, IconReceipt, IconRefresh, IconTag, IconTrash, IconTrendingUp, IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import AdminFab from "@/components/admin/AdminFab";
import type { Agendamento, AgendamentoStatus, FechamentoDia } from "@/lib/agendamentos-types";
import { parsePriceNum, resolverDuracaoMin } from "@/lib/agendamentos-types";
import type { Barbeiro } from "@/lib/barbeiros-types";
import type { Item } from "@/lib/admin-items";
import type { CategoriaServico } from "@/lib/admin-categorias-servicos";
import { toDateKey } from "@/lib/date-utils";
import { gerarSlotsData, mesclarGrade, slotsOcupadosPorAgendamento, ocupacaoDeAgendamentos, calcularSlotsLivres, GRADE_DEFAULT, PASSO_DEFAULT, PASSO_MIN, PASSO_MAX, CARENCIA_DEFAULT, CARENCIA_MAX, DIAS_SEMANA, type GradeConfig, type DiaGrade } from "@/lib/grade";
import AnimatedModal from "@/components/ui/Modal";

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

// ─── Calendário mensal rico ───────────────────────────────────────────────────

function CalendarioMensal({
  dataSelecionada,
  agendamentos,
  fechamentos,
  slotsBloqueados,
  onSelect,
  semMoldura = false,
  retratil = false,
  onExpandir,
}: {
  dataSelecionada: string;
  agendamentos: Agendamento[];
  fechamentos: FechamentoDia[];
  slotsBloqueados: string[];
  onSelect: (key: string) => void;
  semMoldura?: boolean; // dentro de um overlay que já tem sua moldura — remove borda/padding externos
  retratil?: boolean;   // padrão do Caixa: recolhido = semana, expandido = mês (só faz sentido com semMoldura)
  onExpandir?: (expandido: boolean) => void; // avisa o pai quando expande/recolhe (pra centralizar na tela)
}) {
  const hoje = toDateKey(new Date());
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(dataSelecionada + "T12:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  // Semana de referência (âncora): domingo da semana visível quando recolhido.
  const inicioSemana = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(12, 0, 0, 0); return x; };
  const [refSemana, setRefSemana] = useState(() => inicioSemana(new Date(dataSelecionada + "T12:00:00")));
  const [expandido, setExpandido] = useState(false); // false = semana, true = mês

  useEffect(() => {
    const d = new Date(dataSelecionada + "T12:00:00");
    setViewDate({ year: d.getFullYear(), month: d.getMonth() });
    setRefSemana(inicioSemana(d));
  }, [dataSelecionada]);
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const { year, month } = viewDate;
  // No modo overlay (semMoldura) usa "MÊS ANO" sem o "de" — igual ao calendário do Caixa.
  const MESES_CURTO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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
  function navSemana(delta: number) {
    setRefSemana((prev) => { const x = new Date(prev); x.setDate(x.getDate() + delta * 7); return x; });
  }
  // '‹ ›' navega semana (recolhido) ou mês (expandido)
  const navContexto = (delta: number) => (retratil && !expandido ? navSemana(delta) : navMes(delta));
  // 7 dias da semana visível (recolhido)
  const diasSemanaVisiveis = Array.from({ length: 7 }, (_, i) => { const x = new Date(refSemana); x.setDate(x.getDate() + i); return x; });
  // label do cabeçalho: no recolhido mostra o mês da semana de referência
  const mesRef = retratil && !expandido ? refSemana.getMonth() : month;
  const anoRef = retratil && !expandido ? refSemana.getFullYear() : year;
  const nomeMes = semMoldura
    ? `${MESES_CURTO[mesRef]} ${anoRef}`
    : new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Renderiza UMA célula do calendário a partir de um Date (reusada por semana e mês).
  function renderCelula(dObj: Date) {
    const dia = dObj.getDate();
    const key = toDateKey(dObj);
    const selecionado = key === dataSelecionada;
    const isHoje = key === hoje;
    const ags = agsPorDia[key] ?? [];
    const temAg = ags.length > 0;
    const fechado = fechPorDia.has(key);
    const fat = fatPorDia[key];
    const isPast = key < hoje;
    const isHover = hoverKey === key;
    const foraDoMes = expandido || !retratil ? false : dObj.getMonth() !== mesRef;

    const clsCel = semMoldura
      ? `relative w-full py-2 flex flex-col items-center justify-center rounded border text-xs transition-all
          ${selecionado
            ? "border-[#F5E6C8]/40 bg-[#1a1a1a] text-white"
            : isHoje
            ? "border-[#F5E6C8]/15 text-white"
            : isPast && temAg
            ? "border-transparent bg-[#141414] text-gray-300 hover:bg-[#1a1a1a]"
            : "border-transparent text-gray-500 hover:bg-[#141414] hover:text-[#F5E6C8]"}
          ${foraDoMes ? "opacity-30" : ""}`
      : `relative w-full h-10 flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
          ${selecionado
            ? "bg-[#b8944a] text-[#0A0A0A] shadow-[0_0_12px_rgba(184,148,74,0.3)]"
            : isHoje
            ? "border-2 border-[#b8944a]/70 text-[#b8944a]"
            : isPast && temAg
            ? "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
            : "text-gray-400 hover:bg-[#1a1a1a] hover:text-[#F5E6C8]"}`;

    return (
      <div key={key} className="relative">
        <button
          onClick={() => onSelect(key)}
          onMouseEnter={() => setHoverKey(key)}
          onMouseLeave={() => setHoverKey(null)}
          className={clsCel}
        >
          <span className={semMoldura ? "font-medium leading-none" : "font-bold leading-none"}>{dia}</span>
          <div className="flex gap-0.5 mt-0.5 h-1 items-center">
            {temAg && <span className={`w-1 h-1 rounded-full ${selecionado && !semMoldura ? "bg-[#0A0A0A]/50" : "bg-[#b8944a]"}`} />}
            {fechado && <span className={`w-1 h-1 rounded-full ${selecionado && !semMoldura ? "bg-[#0A0A0A]/50" : "bg-green-500"}`} />}
          </div>
        </button>
        {isHover && (temAg || fechado || fat) && !selecionado && (
          <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1e1e1e] border border-[#3d3d3d] rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl pointer-events-none">
            {temAg && <p className="text-[#b8944a] font-semibold">{ags.length} agendamento{ags.length > 1 ? "s" : ""}</p>}
            {fat !== undefined && <p className="text-green-400">R$ {fat.toFixed(2).replace(".", ",")} faturado</p>}
            {fechado && <p className="text-green-300 flex items-center gap-1"><IconLock size={8} /> Caixa fechado</p>}
            {!fechado && isPast && temAg && <p className="text-red-400 flex items-center gap-1"><IconLockOpen size={8} /> Caixa em aberto</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={semMoldura ? "select-none" : "bg-[#111] border border-[#2d2d2d] rounded-xl p-5 select-none"}>
      {/* cabeçalho — semMoldura navega '‹ MÊS ANO ⌄ ›' centralizado. Com retratil, o
          MÊS+chevron alterna semana↔mês; '‹ ›' navega semana (recolhido) ou mês (expandido). */}
      {semMoldura ? (
        <div className="flex items-center justify-center gap-3 mb-4">
          <button onClick={() => navContexto(-1)} className="p-1 text-gray-500 hover:text-[#b8944a] transition"><IconChevronLeft size={16} /></button>
          <span className="text-xs font-bold tracking-widest text-[#F5E6C8] uppercase min-w-[130px] text-center">{nomeMes}</span>
          <button onClick={() => navContexto(1)} className="p-1 text-gray-500 hover:text-[#b8944a] transition"><IconChevronRight size={16} /></button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navMes(-1)} className="p-1.5 text-gray-400 hover:text-[#b8944a] transition rounded-lg hover:bg-[#1a1a1a]"><IconChevronLeft size={16} /></button>
          <span className="text-sm font-bold text-[#F5E6C8] capitalize">{nomeMes}</span>
          <button onClick={() => navMes(1)} className="p-1.5 text-gray-400 hover:text-[#b8944a] transition rounded-lg hover:bg-[#1a1a1a]"><IconChevronRight size={16} /></button>
        </div>
      )}

      {/* dias da semana */}
      <div className="grid grid-cols-7 mb-2">
        {DIAS_SEMANA.map((d, i) => (
          semMoldura
            ? <div key={d} className="text-center text-[9px] font-medium tracking-widest text-gray-600 py-1 uppercase">{d}</div>
            : <div key={d} className={`text-center text-[10px] font-semibold py-1 ${i === 0 ? "text-red-500/60" : "text-gray-600"}`}>{d}</div>
        ))}
      </div>

      {/* células — recolhido (retratil) mostra só a SEMANA; senão o mês inteiro */}
      {retratil && !expandido ? (
        <motion.div key={`sem-${toDateKey(refSemana)}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="grid grid-cols-7 gap-1">
          {diasSemanaVisiveis.map((dObj) => renderCelula(dObj))}
        </motion.div>
      ) : (
        <motion.div key={`mes-${year}-${month}`} initial={retratil ? { opacity: 0, height: 0 } : false} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: "hidden" }} className="grid grid-cols-7 gap-1">
          {cells.map((dia, i) => {
            if (!dia) return <div key={i} className={semMoldura ? "" : "h-10"} />;
            return renderCelula(new Date(year, month, dia, 12));
          })}
        </motion.div>
      )}

      {/* botão largo pra expandir/recolher o mês (padrão do Caixa, mais óbvio de achar) */}
      {retratil && (
        <button
          onClick={() => setExpandido((v) => { const nv = !v; onExpandir?.(nv); return nv; })}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#242424] text-[10px] font-semibold tracking-widest uppercase text-gray-500 hover:text-[#b8944a] hover:border-[#b8944a]/40 transition"
        >
          {expandido ? "Recolher" : "Ver mês inteiro"}
          <IconChevronDown size={13} className={`transition-transform ${expandido ? "rotate-180" : ""}`} />
        </button>
      )}

      {/* legenda — entra por último (fade+slide) pra não "aparecer pronta" enquanto
          o calendário ainda desliza pra dentro (bottom-sheet no mobile).
          No overlay estilo Caixa (semMoldura) a legenda é omitida. */}
      {!semMoldura && (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#1a1a1a]"
      >
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-[#b8944a]" /> agendamentos</div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> caixa fechado</div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-3 h-3 rounded border-2 border-[#b8944a]/60" /> hoje</div>
      </motion.div>
      )}
    </div>
  );
}

// ─── modais ───────────────────────────────────────────────────────────────────

function Modal({ open, titulo, mensagem, confirmLabel, confirmClass, onConfirm, onCancel }: {
  open: boolean; titulo: string; mensagem: React.ReactNode; confirmLabel: string;
  confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <AnimatedModal open={open} onClose={onCancel} className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
      <h3 className="font-bold text-[#F5E6C8]">{titulo}</h3>
      <div className="text-sm text-gray-400 leading-relaxed">{mensagem}</div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">Cancelar</button>
        <button onClick={onConfirm} className={`px-4 py-2 text-sm text-white rounded transition ${confirmClass}`}>{confirmLabel}</button>
      </div>
    </AnimatedModal>
  );
}

interface AssinaturaInfo { id: string; clienteNome: string; cortesRestantes: number; planoCortesTotal: number; status: string; }

interface CupomInfo { codigo: string; tipo: "percentual" | "fixo"; valor: number; desconto: number; }
type AgStep = "servico" | "barbeiro" | "dataHora" | "dados";

// Modal de agendamento do admin — MESMO fluxo do lado cliente (wizard):
// serviço → barbeiro → data/horário → dados. Telefone opcional, com cupom e crédito de assinatura.
// Se vier de um slot da grade (preData+preHorario), pula a etapa de data/horário.
function AgendarModal({ open, onClose, servicos, categorias, barbeiros, grade, passoMin, carenciaMin, preData, preHorario, onCriar }: {
  open: boolean; onClose: () => void;
  servicos: Item[]; categorias: CategoriaServico[]; barbeiros: Barbeiro[]; grade: GradeConfig; passoMin: number; carenciaMin: number;
  preData?: string | null; preHorario?: string | null;
  onCriar: (dados: { nome: string; telefone: string; servico: string; preco: string; data: string; horario: string; duracaoMin?: number; barbeiroId?: string; barbeiroNome?: string; usarCredito?: boolean; assinaturaId?: string; cupom?: string | null }) => Promise<void>;
}) {
  const hojeKey = toDateKey(new Date());
  const preSel = !!(preData && preHorario);
  const passos: AgStep[] = preSel ? ["servico", "barbeiro", "dados"] : ["servico", "barbeiro", "dataHora", "dados"];

  const [step, setStep] = useState<AgStep>("servico");
  // multi-serviço: mesmo barbeiro, durações e preços somados (igual ao fluxo do cliente)
  const [servicosSel, setServicosSel] = useState<Item[]>([]);
  const [catFiltro, setCatFiltro] = useState<string>(""); // ""=todas · "__sem__"=sem categoria · id
  const [precoEditado, setPrecoEditado] = useState<string | null>(null); // admin sobrescreveu o preço somado?
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null);
  const [barbeiroNome, setBarbeiroNome] = useState<string | null>(null);
  const [dataKey, setDataKey] = useState(preData ?? hojeKey);
  const [horario, setHorario] = useState(preHorario ?? "");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [codigoCupom, setCodigoCupom] = useState("");
  const [cupom, setCupom] = useState<CupomInfo | null>(null);
  const [erroCupom, setErroCupom] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [assinatura, setAssinatura] = useState<AssinaturaInfo | null>(null);
  const [buscandoAssinatura, setBuscandoAssinatura] = useState(false);
  const [usarCredito, setUsarCredito] = useState(false);
  const [slotsOcupados, setSlotsOcupados] = useState<string[]>([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2.5 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition";

  // reset ao (re)abrir
  useEffect(() => {
    if (!open) return;
    setStep("servico"); setServicosSel([]); setPrecoEditado(null);
    setBarbeiroId(null); setBarbeiroNome(null);
    setDataKey(preData ?? hojeKey); setHorario(preHorario ?? "");
    setNome(""); setTelefone(""); setCodigoCupom(""); setCupom(null); setErroCupom("");
    setAssinatura(null); setUsarCredito(false); setSalvando(false); setErro("");
  }, [open, preData, preHorario, hojeKey]);

  // assinatura pelo telefone
  useEffect(() => {
    const tel = telefone.replace(/\D/g, "");
    if (tel.length < 10) { setAssinatura(null); setUsarCredito(false); return; }
    const t = setTimeout(async () => {
      setBuscandoAssinatura(true);
      try {
        const res = await fetch(`/api/assinatura/status?telefone=${tel}`, { credentials: "include" });
        const j = await res.json();
        const a = j.assinatura ?? null;
        setAssinatura(a);
        setUsarCredito(a?.status === "ativa" && a?.cortesRestantes > 0);
        setNome((n) => (a && !n.trim() ? a.clienteNome : n));
      } catch { setAssinatura(null); }
      finally { setBuscandoAssinatura(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [telefone]);

  // slots ocupados do barbeiro escolhido (só no fluxo completo, com barbeiro definido).
  // /api/slots já expande a duração de cada agendamento do barbeiro.
  useEffect(() => {
    if (!open || preSel) return;
    if (!barbeiroId) { setSlotsOcupados([]); return; } // barbeiro obrigatório
    let cancel = false;
    setCarregandoSlots(true);
    (async () => {
      try {
        const res = await fetch(`/api/slots?data=${dataKey}&barbeiroId=${encodeURIComponent(barbeiroId)}`, { credentials: "include" });
        const { bloqueados } = await res.json();
        if (!cancel) setSlotsOcupados(bloqueados ?? []);
      } finally { if (!cancel) setCarregandoSlots(false); }
    })();
    return () => { cancel = true; };
  }, [open, preSel, dataKey, barbeiroId]);

  // ── serviço(s) somados: nomes, preço e duração (mesma lógica do fluxo do cliente) ──
  const servico = servicosSel.map((s) => s.titulo).join(" + ");
  const precoSomado = servicosSel.reduce((acc, s) => acc + parsePriceNum(s.preco), 0);
  const duracaoMin = servicosSel.reduce((acc, s) => acc + resolverDuracaoMin(s, passoMin), 0);
  // preço padrão = soma dos serviços; admin pode sobrescrever (precoEditado)
  const precoStrBase = precoSomado > 0 ? precoSomado.toFixed(2).replace(".", ",") : "";
  const preco = precoEditado !== null ? precoEditado : precoStrBase;

  // FONTE DA VERDADE: mesma função de disponibilidade de todas as telas.
  // Reserva o intervalo pela duração somada, respeita passo/carência e almoço.
  const slotsDisponiveis = (() => {
    const dow = new Date(dataKey + "T12:00:00").getDay();
    // slotsOcupados já vem expandido por duração (bloqueios + agendamentos do dia)
    const ocupados = new Set(slotsOcupados);
    const agora = new Date();
    const ehHoje = dataKey === hojeKey;
    return calcularSlotsLivres({
      dia: grade[dow],
      passoMin,
      carenciaMin,
      duracaoMin,
      ocupados,
      agoraMin: ehHoje ? agora.getHours() * 60 + agora.getMinutes() : undefined,
    });
  })();

  const precoBase = parseFloat((preco || "").replace(",", ".")) || 0;
  const precoFinal = cupom ? Math.max(precoBase - cupom.desconto, 0) : precoBase;
  const temCredito = assinatura?.status === "ativa" && (assinatura?.cortesRestantes ?? 0) > 0;

  function toggleServico(s: Item) {
    setServicosSel((prev) => prev.some((x) => x.id === s.id) ? prev.filter((x) => x.id !== s.id) : [...prev, s]);
  }

  // Filtro por categoria (igual ao fluxo do cliente): só mostra chips quando há
  // 2+ categorias com serviço; "Outros" cobre serviços sem categoria.
  const catsComServico = categorias.filter((c) => servicos.some((s) => s.categoriaId === c.id));
  const temSemCategoria = servicos.some((s) => !s.categoriaId || !categorias.some((c) => c.id === s.categoriaId));
  const mostrarFiltros = catsComServico.length > 1;
  const servicosVisiveis = catFiltro === ""
    ? servicos
    : catFiltro === "__sem__"
    ? servicos.filter((s) => !s.categoriaId || !categorias.some((c) => c.id === s.categoriaId))
    : servicos.filter((s) => s.categoriaId === catFiltro);

  async function aplicarCupom() {
    if (!codigoCupom.trim()) return;
    setValidandoCupom(true); setErroCupom("");
    const res = await fetch(`/api/cupons?codigo=${encodeURIComponent(codigoCupom.trim())}`);
    const data = await res.json();
    setValidandoCupom(false);
    if (!data.valido) { setCupom(null); setErroCupom(data.mensagem ?? "Cupom inválido"); return; }
    const desconto = data.cupom.tipo === "percentual" ? parseFloat(((precoBase * data.cupom.valor) / 100).toFixed(2)) : Math.min(data.cupom.valor, precoBase);
    setCupom({ codigo: data.cupom.codigo, tipo: data.cupom.tipo, valor: data.cupom.valor, desconto });
  }

  async function confirmar() {
    if (nome.trim().length < 2) { setErro("Informe o nome do cliente"); return; }
    setSalvando(true); setErro("");
    const precoStr = usarCredito ? "0" : (precoFinal > 0 ? precoFinal.toFixed(2).replace(".", ",") : preco);
    try {
      await onCriar({
        nome, telefone, servico, preco: precoStr,
        data: dataKey, horario,
        duracaoMin: duracaoMin > 0 ? duracaoMin : undefined,
        barbeiroId: barbeiroId ?? undefined, barbeiroNome: barbeiroNome ?? undefined,
        usarCredito: usarCredito && !!assinatura, assinaturaId: usarCredito && assinatura ? assinatura.id : undefined,
        cupom: cupom?.codigo ?? null,
      });
      onClose();
    } catch { setErro("Erro ao criar. Tente de novo."); }
    finally { setSalvando(false); }
  }

  const dataLabel = new Date(dataKey + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const idx = passos.indexOf(step);
  const irAposBarbeiro = () => setStep(preSel ? "dados" : "dataHora");

  return (
    <AnimatedModal open={open} onClose={onClose} className="nice-scroll bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl max-w-md w-full mx-4 flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-1.5 mb-3">
          {passos.map((p, i) => (
            <div key={p} className={`flex items-center gap-1.5 ${i < passos.length - 1 ? "flex-1" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${i < idx ? "bg-[#b8944a] text-[#0A0A0A]" : i === idx ? "bg-[#b8944a]/20 border border-[#b8944a] text-[#b8944a]" : "bg-[#1a1a1a] border border-[#2d2d2d] text-gray-600"}`}>{i < idx ? <IconCheck size={12} /> : i + 1}</div>
              {i < passos.length - 1 && <div className={`h-px flex-1 ${i < idx ? "bg-[#b8944a]" : "bg-[#2d2d2d]"}`} />}
            </div>
          ))}
        </div>
        <h3 className="font-bold text-[#F5E6C8]">
          {step === "servico" ? "Escolha o serviço" : step === "barbeiro" ? "Escolha o barbeiro" : step === "dataHora" ? "Data e horário" : "Dados do cliente"}
        </h3>
        {preSel && <p className="text-xs text-[#b8944a] mt-0.5 capitalize">{dataLabel} às {horario}</p>}
      </div>

      <div className="px-5 py-4 flex flex-col gap-3 max-h-[58vh] overflow-y-auto">
        {step === "servico" && (
          servicos.length === 0 ? <p className="text-sm text-gray-500 text-center py-6">Nenhum serviço cadastrado.</p> :
          <>
            <p className="text-[11px] text-gray-500 -mt-1">Pode marcar mais de um — a duração e o preço somam.</p>
            {mostrarFiltros && (
              <div className="shrink-0 flex gap-2 flex-nowrap overflow-x-auto pb-1 -mx-1 px-1">
                <button onClick={() => setCatFiltro("")}
                  className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition ${catFiltro === "" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a] hover:text-[#b8944a]"}`}>
                  Todos
                </button>
                {catsComServico.map((c) => (
                  <button key={c.id} onClick={() => setCatFiltro(c.id)}
                    className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition ${catFiltro === c.id ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a] hover:text-[#b8944a]"}`}>
                    {c.nome}
                  </button>
                ))}
                {temSemCategoria && (
                  <button onClick={() => setCatFiltro("__sem__")}
                    className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition ${catFiltro === "__sem__" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a] hover:text-[#b8944a]"}`}>
                    Outros
                  </button>
                )}
              </div>
            )}
            {servicosVisiveis.length === 0 ? <p className="text-sm text-gray-500 text-center py-6">Nenhum serviço nesta categoria.</p> :
            servicosVisiveis.map((s) => {
              const marcado = servicosSel.some((x) => x.id === s.id);
              return (
                <button key={s.id} onClick={() => { toggleServico(s); setCupom(null); }}
                  className={`text-left border p-4 rounded-xl active:scale-[0.98] transition-all duration-200 group ${marcado ? "border-[#b8944a] bg-[#b8944a]/10" : "border-[#2d2d2d] bg-[#111] hover:border-[#b8944a] hover:bg-[#b8944a]/5"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${marcado ? "bg-[#b8944a] border-[#b8944a]" : "border-[#3d3d3d]"}`}>
                        {marcado && <IconCheck size={13} className="text-[#0A0A0A]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#F5E6C8] group-hover:text-[#b8944a] transition">{s.titulo}</p>
                        {s.descricao && <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">{s.descricao}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {s.preco && <p className="text-[#b8944a] font-bold text-sm">R$ {s.preco}</p>}
                      {(s.duracaoMin || s.duracao) && <p className="text-xs text-gray-600 mt-0.5">{resolverDuracaoMin(s, passoMin)} min</p>}
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {step === "barbeiro" && (
          <>
            {barbeiros.length === 0 && <p className="text-sm text-gray-500 text-center py-6">Nenhum barbeiro cadastrado.</p>}
            {barbeiros.map((b) => (
              <button key={b.id} onClick={() => { setBarbeiroId(b.id); setBarbeiroNome(b.apelido ?? b.nome); irAposBarbeiro(); }}
                className="text-left border border-[#2d2d2d] bg-[#111] p-3.5 rounded-xl hover:border-[#b8944a] hover:bg-[#b8944a]/5 transition flex items-center gap-3">
                {b.foto ? <img src={b.foto} alt={b.nome} className="w-10 h-10 rounded-full object-cover shrink-0" /> : <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center text-[#b8944a] font-bold shrink-0">{b.nome.charAt(0).toUpperCase()}</div>}
                <div className="min-w-0"><p className="font-semibold text-[#F5E6C8] truncate">{b.nome}</p>{b.apelido && <p className="text-[11px] text-gray-500">{b.apelido}</p>}</div>
              </button>
            ))}
          </>
        )}

        {step === "dataHora" && (
          <>
            <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Data</label>
              <DateFieldBR value={dataKey} min={hojeKey} onChange={(v) => { setDataKey(v); setHorario(""); }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 capitalize">{dataLabel}</label>
              {carregandoSlots ? <p className="text-sm text-gray-600 py-3 text-center">Carregando horários...</p> :
               slotsDisponiveis.length === 0 ? <p className="text-sm text-gray-500 py-3 text-center">Sem horários disponíveis neste dia.</p> :
               <div className="grid grid-cols-4 gap-2 max-h-[240px] overflow-y-auto nice-scroll -mr-1 pr-1">
                 {slotsDisponiveis.map((s) => (
                   <button key={s} onClick={() => setHorario(s)} className={`py-2 text-sm rounded-lg border font-medium transition ${horario === s ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]" : "border-[#2d2d2d] text-[#F5E6C8] hover:border-[#b8944a]"}`}>{s}</button>
                 ))}
               </div>}
            </div>
          </>
        )}

        {step === "dados" && (
          <>
            <div className="bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-3 flex flex-col gap-1 text-xs">
              <div className="flex justify-between gap-3"><span className="text-gray-500 shrink-0">Serviço</span><span className="text-[#F5E6C8] font-medium text-right">{servico}</span></div>
              {barbeiroNome && <div className="flex justify-between"><span className="text-gray-500">Barbeiro</span><span className="text-[#F5E6C8]">{barbeiroNome}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Data</span><span className="text-[#F5E6C8] capitalize">{dataLabel}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Horário</span><span className="text-[#F5E6C8]">{horario}{duracaoMin > 0 && <span className="text-gray-500"> · {duracaoMin} min</span>}</span></div>
            </div>
            <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Nome do cliente</label><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" className={inp} /></div>
            <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">WhatsApp (opcional)</label>
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="11999999999" inputMode="tel" className={inp} />
              {buscandoAssinatura && <p className="text-[10px] text-gray-600">Verificando assinatura...</p>}
              {assinatura && !buscandoAssinatura && (
                <div className={`rounded-lg px-3 py-2.5 flex flex-col gap-2 border ${temCredito ? "bg-[#b8944a]/8 border-[#b8944a]/30" : "bg-[#1a1a1a] border-[#2d2d2d]"}`}>
                  <div className="flex items-center justify-between">
                    <div><p className={`text-xs font-semibold ${temCredito ? "text-[#b8944a]" : "text-gray-500"}`}>{temCredito ? "Assinante ativo" : "Assinante sem créditos"}</p><p className="text-[10px] text-gray-500 mt-0.5">{assinatura.cortesRestantes}/{assinatura.planoCortesTotal} cortes restantes</p></div>
                    {temCredito && <button type="button" onClick={() => setUsarCredito((v) => !v)} className={`relative w-10 h-5 rounded-full transition-colors ${usarCredito ? "bg-[#b8944a]" : "bg-[#2d2d2d]"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${usarCredito ? "left-5" : "left-0.5"}`} /></button>}
                  </div>
                  {usarCredito && <p className="text-[10px] text-[#b8944a]/80">1 crédito será consumido da assinatura</p>}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Preço (R$){servicosSel.length > 1 && <span className="text-gray-600"> · soma de {servicosSel.length} serviços</span>}</label>
              <input value={preco} onChange={(e) => { setPrecoEditado(e.target.value); setCupom(null); }} placeholder="55" className={`${inp} disabled:opacity-50`} disabled={usarCredito} />
            </div>
            {!usarCredito && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 flex items-center gap-1.5"><IconTag size={12} /> Cupom (opcional)</label>
                <div className="flex gap-2">
                  <input value={codigoCupom} onChange={(e) => { setCodigoCupom(e.target.value.toUpperCase()); setErroCupom(""); setCupom(null); }} placeholder="ORTEGA10" disabled={!!cupom} className={`${inp} flex-1 font-mono disabled:opacity-50`} />
                  {cupom ? <button onClick={() => { setCupom(null); setCodigoCupom(""); }} className="px-3 py-2 text-xs text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/20 transition">Remover</button>
                         : <button onClick={aplicarCupom} disabled={!codigoCupom.trim() || validandoCupom} className="px-3 py-2 text-xs bg-[#b8944a]/10 border border-[#b8944a]/40 text-[#b8944a] rounded-lg hover:bg-[#b8944a]/20 transition disabled:opacity-40">{validandoCupom ? "..." : "Aplicar"}</button>}
                </div>
                {erroCupom && <p className="text-[10px] text-red-400">{erroCupom}</p>}
                {cupom && <p className="text-[10px] text-green-400">✓ -R$ {cupom.desconto.toFixed(2).replace(".", ",")} · total R$ {precoFinal.toFixed(2).replace(".", ",")}</p>}
              </div>
            )}
            {erro && <p className="text-xs text-red-400 text-center">{erro}</p>}
          </>
        )}
      </div>

      <div className="px-5 py-4 border-t border-[#1e1e1e] flex gap-2 justify-between items-center shrink-0">
        <button onClick={() => { if (idx === 0) onClose(); else setStep(passos[idx - 1]); }} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">{idx === 0 ? "Cancelar" : "← Voltar"}</button>
        {step === "servico" && (
          <div className="flex items-center gap-3">
            {servicosSel.length > 0 && <span className="text-[11px] text-gray-500 hidden sm:block">{servicosSel.length} serviço{servicosSel.length > 1 ? "s" : ""} · {duracaoMin} min</span>}
            <button onClick={() => setStep("barbeiro")} disabled={servicosSel.length === 0} className="px-4 py-2 text-sm text-[#0A0A0A] bg-[#b8944a] hover:bg-[#c9a84c] rounded transition disabled:opacity-40">Continuar →</button>
          </div>
        )}
        {step === "dataHora" && <button onClick={() => setStep("dados")} disabled={!horario} className="px-4 py-2 text-sm text-[#0A0A0A] bg-[#b8944a] hover:bg-[#c9a84c] rounded transition disabled:opacity-40">Continuar →</button>}
        {step === "dados" && <button onClick={confirmar} disabled={salvando || nome.trim().length < 2} className="px-4 py-2 text-sm text-[#0A0A0A] bg-[#b8944a] hover:bg-[#c9a84c] rounded transition disabled:opacity-40">{salvando ? "Salvando..." : "Confirmar"}</button>}
      </div>
    </AnimatedModal>
  );
}

// Seletor de data no tema do Ortega — sempre DD/MM/AAAA (o <input type=date> nativo
// segue o locale do navegador e não dá pra forçar pt-BR de forma confiável).
const DP_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DP_DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
function DateFieldBR({ value, min, onChange }: { value: string; min: string; onChange: (v: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [mesVis, setMesVis] = useState(() => { const d = new Date(value + "T12:00:00"); return new Date(d.getFullYear(), d.getMonth(), 1); });
  useEffect(() => { const d = new Date(value + "T12:00:00"); setMesVis(new Date(d.getFullYear(), d.getMonth(), 1)); }, [value]);

  const minDate = new Date(min + "T00:00:00");
  const ano = mesVis.getFullYear(); const mes = mesVis.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [];
  for (let i = 0; i < primeiroDia; i++) celulas.push(null);
  for (let d = 1; d <= ultimoDia; d++) celulas.push(d);
  const labelBR = new Date(value + "T12:00:00").toLocaleDateString("pt-BR");

  return (
    <div>
      <button type="button" onClick={() => setAberto((v) => !v)}
        className="bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full flex items-center justify-between hover:border-[#b8944a]/60 transition">
        <span>{labelBR}</span>
        <IconCalendar size={15} className="text-gray-500" />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            key="cal"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setMesVis(new Date(ano, mes - 1, 1))} className="p-1 text-gray-400 hover:text-[#b8944a] transition"><IconChevronLeft size={16} /></button>
                <span className="text-xs font-medium text-[#F5E6C8]">{DP_MESES[mes]} {ano}</span>
                <button type="button" onClick={() => setMesVis(new Date(ano, mes + 1, 1))} className="p-1 text-gray-400 hover:text-[#b8944a] transition"><IconChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DP_DIAS.map((d, i) => <div key={i} className={`text-center text-[10px] py-0.5 ${i === 0 ? "text-red-500/70" : "text-gray-600"}`}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {celulas.map((d, i) => {
                  if (!d) return <div key={i} className="h-8" />;
                  const key = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const cellDate = new Date(ano, mes, d); cellDate.setHours(0, 0, 0, 0);
                  const desab = cellDate < minDate;
                  const sel = key === value;
                  return (
                    <button key={i} type="button" disabled={desab} onClick={() => { onChange(key); setAberto(false); }}
                      className={`h-8 rounded text-xs transition ${sel ? "bg-[#b8944a] text-[#0A0A0A] font-bold" : desab ? "text-gray-700 cursor-not-allowed" : "text-gray-300 hover:bg-[#b8944a]/10"}`}>{d}</button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReagendarModal({ open, ag, dataSelecionada, agsDia, slotsBloqueados, grade, passoMin, carenciaMin, onConfirm, onCancel }: {
  open: boolean; ag: Agendamento; dataSelecionada: string; agsDia: Agendamento[]; slotsBloqueados: string[]; grade: GradeConfig; passoMin: number; carenciaMin: number;
  onConfirm: (novaData: string, novoHorario: string) => void; onCancel: () => void;
}) {
  const [novaData, setNovaData] = useState(dataSelecionada);
  const [novoHorario, setNovoHorario] = useState("");
  const [slotsLivresFetch, setSlotsLivresFetch] = useState<string[] | null>(null);
  const [buscandoSlots, setBuscandoSlots] = useState(false);
  const hojeKey = toDateKey(new Date());
  // o serviço mantém a duração ao reagendar — reserva o mesmo intervalo no novo horário
  const duracaoAg = ag.duracaoMin && ag.duracaoMin > 0 ? ag.duracaoMin : passoMin;

  // horários livres na DATA JÁ CARREGADA (dataSelecionada): mesma lógica central,
  // excluindo o próprio agendamento e mantendo o horário atual dele como opção.
  const slotsMesmaData = (() => {
    const ocupacao = ocupacaoDeAgendamentos(agsDia.filter((a) => a.id !== ag.id), passoMin);
    for (const b of slotsBloqueados) ocupacao.add(b);
    const dow = new Date(dataSelecionada + "T12:00:00").getDay();
    const agora = new Date();
    const livres = calcularSlotsLivres({
      dia: grade[dow], passoMin, carenciaMin, duracaoMin: duracaoAg, ocupados: ocupacao,
      agoraMin: dataSelecionada === hojeKey ? agora.getHours() * 60 + agora.getMinutes() : undefined,
    });
    // garante que o horário atual do agendamento apareça (pra não sumir da lista ao reabrir)
    if (!livres.includes(ag.horario) && dataSelecionada !== hojeKey) return [ag.horario, ...livres].sort();
    return livres;
  })();

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
      // FONTE DA VERDADE: expande os agendamentos pela duração (menos o próprio),
      // soma bloqueios, e calcula os horários onde o serviço inteiro cabe.
      const ocupacao = ocupacaoDeAgendamentos(ags.filter((a) => a.id !== ag.id), passoMin);
      for (const b of bloqueados) ocupacao.add(b);
      const dow = new Date(novaData + "T12:00:00").getDay();
      const agora = new Date();
      const livres = calcularSlotsLivres({
        dia: grade[dow],
        passoMin,
        carenciaMin,
        duracaoMin: duracaoAg,
        ocupados: ocupacao,
        agoraMin: novaData === hojeKey ? agora.getHours() * 60 + agora.getMinutes() : undefined,
      });
      setSlotsLivresFetch(livres);
      setBuscandoSlots(false);
    }).catch(() => setBuscandoSlots(false));
  }, [novaData, dataSelecionada, ag.id, hojeKey, grade, passoMin, carenciaMin, duracaoAg]);

  const slotsParaData = novaData === dataSelecionada
    ? slotsMesmaData
    : (slotsLivresFetch ?? []);

  return (
    <AnimatedModal open={open} onClose={onCancel} className="nice-scroll bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div><h3 className="font-bold text-[#F5E6C8]">Reagendar</h3><p className="text-xs text-gray-500 mt-0.5">{ag.nome} · {ag.servico}</p></div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Nova data</label><DateFieldBR value={novaData} min={toDateKey(new Date())} onChange={(v) => { setNovaData(v); setNovoHorario(""); }} /></div>
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
    </AnimatedModal>
  );
}

type ModalState = { tipo: "concluir" | "nao_compareceu" | "excluir" | "fechar_caixa" | "bloquear" | "fechar_dia" | "fechar_dia_2" | "liberar_dia" | "caixa_fechado_retro"; id?: string; horario?: string } | null;

// Modal de configuração da grade — horários padrão por dia da semana + almoço.
function ConfigGradeModal({ open, grade, passoMin, carenciaMin, salvando, agendamentos, onSave, onClose }: {
  open: boolean; grade: GradeConfig; passoMin: number; carenciaMin: number; salvando: boolean; agendamentos: Agendamento[]; onSave: (g: GradeConfig, passo: number, carencia: number) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<GradeConfig>(grade);
  // passo e carência controlados como string (edição livre); validados no salvar
  const [passoStr, setPassoStr] = useState<string>(String(passoMin));
  const [passoErro, setPassoErro] = useState(false);
  const [carenciaStr, setCarenciaStr] = useState<string>(String(carenciaMin));
  const [carenciaErro, setCarenciaErro] = useState(false);
  const passoRef = useRef<HTMLInputElement>(null);
  const carenciaRef = useRef<HTMLInputElement>(null);
  // Horário padrão: aplica abre/fecha/almoço a um conjunto de dias de uma vez.
  const [padrao, setPadrao] = useState({ inicio: "09:00", fim: "18:00", almocoInicio: "12:00", almocoFim: "13:00" });
  const [diasSel, setDiasSel] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  // feedback da aplicação em massa (ação sensível): confirma quantos dias foram alterados
  const [aplicadoFeedback, setAplicadoFeedback] = useState<number | null>(null);
  // pediu confirmação extra porque a mudança afeta agendamentos já efetuados
  const [confirmandoConflito, setConfirmandoConflito] = useState(false);
  useEffect(() => { if (open) { setDraft(grade); setPassoStr(String(passoMin)); setCarenciaStr(String(carenciaMin)); setPassoErro(false); setCarenciaErro(false); setConfirmandoConflito(false); } }, [open, grade, passoMin, carenciaMin]);
  // qualquer edição do draft invalida a confirmação anterior (a lista de conflitos mudou)
  useEffect(() => { setConfirmandoConflito(false); }, [draft, passoStr, carenciaStr]);

  const passoNum = parseInt(passoStr, 10);
  const passoValido = Number.isFinite(passoNum) && passoNum >= PASSO_MIN && passoNum <= PASSO_MAX;
  const carenciaNum = carenciaStr === "" ? 0 : parseInt(carenciaStr, 10);
  const carenciaValida = Number.isFinite(carenciaNum) && carenciaNum >= 0 && carenciaNum <= CARENCIA_MAX;

  // Detecta agendamentos FUTUROS (pendente/confirmado, data ≥ hoje) que ficariam
  // fora do horário na grade NOVA (draft): dia desativado, ou horário fora do
  // abre/fecha, ou dentro do novo almoço. Alerta o Igor antes de ele salvar sem querer.
  const conflitos = useMemo(() => {
    const hojeK = toDateKey(new Date());
    const toMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
    return agendamentos.filter((a) => {
      if (a.status !== "pendente" && a.status !== "confirmado") return false;
      if (a.data < hojeK) return false; // já passou — não conta
      const dow = new Date(a.data + "T12:00:00").getDay();
      const d = draft[dow];
      if (!d || !d.ativo) return true; // dia virou fechado
      const m = toMin(a.horario);
      if (m < toMin(d.inicio) || m >= toMin(d.fim)) return true; // fora do expediente novo
      if (d.almocoInicio && d.almocoFim && m >= toMin(d.almocoInicio) && m < toMin(d.almocoFim)) return true; // cai no almoço novo
      return false;
    });
  }, [agendamentos, draft]);

  // valida antes de salvar; se inválido, foca o campo problemático, dispara shake e não salva
  function handleSalvar() {
    if (!passoValido) {
      setPassoErro(true);
      passoRef.current?.focus();
      setTimeout(() => setPassoErro(false), 600);
      return;
    }
    if (!carenciaValida) {
      setCarenciaErro(true);
      carenciaRef.current?.focus();
      setTimeout(() => setCarenciaErro(false), 600);
      return;
    }
    // Se a mudança deixa agendamentos futuros fora do horário, exige uma confirmação
    // extra antes de salvar (não cancela os agendamentos — só avisa que ficam "fora da grade").
    if (conflitos.length > 0 && !confirmandoConflito) {
      setConfirmandoConflito(true);
      return;
    }
    onSave(draft, passoNum, carenciaNum);
  }

  function upd(dow: number, patch: Partial<DiaGrade>) {
    setDraft((prev) => ({ ...prev, [dow]: { ...prev[dow], ...patch } }));
  }
  function toggleDiaSel(dow: number) {
    setDiasSel((prev) => { const n = new Set(prev); n.has(dow) ? n.delete(dow) : n.add(dow); return n; });
  }
  function aplicarPadrao() {
    const qtd = diasSel.size;
    setDraft((prev) => {
      const out = { ...prev };
      diasSel.forEach((dow) => {
        out[dow] = {
          ativo: true,
          inicio: padrao.inicio,
          fim: padrao.fim,
          almocoInicio: padrao.almocoInicio || null,
          almocoFim: padrao.almocoFim || null,
        };
      });
      return out;
    });
    // feedback visível: confirma que os dias foram atualizados (sensível — mexe no funcionamento)
    setAplicadoFeedback(qtd);
    setTimeout(() => setAplicadoFeedback(null), 2600);
  }
  const time = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-2 py-1 text-xs text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

  return (
    <AnimatedModal open={open} onClose={onClose} className="nice-scroll bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl max-w-lg w-full mx-4 flex flex-col">
      <div className="px-5 py-4 border-b border-[#1e1e1e] shrink-0">
        <h3 className="font-bold text-[#F5E6C8] flex items-center gap-2"><IconAdjustments size={15} className="text-[#b8944a]" /> Configurar grade</h3>
        <p className="text-xs text-gray-500 mt-0.5">Reflete na grade e no site do cliente.</p>
      </div>

      {/* ── SEÇÃO: aplicar horário a vários dias de uma vez ─────────────────── */}
      <div className="px-5 py-4 border-b border-[#1e1e1e] flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#b8944a] uppercase tracking-widest">Aplicar a vários dias</span>
          <span className="h-px flex-1 bg-[#1e1e1e]" />
        </div>

        <div className="rounded-xl border border-[#b8944a]/25 bg-[#b8944a]/[0.06] p-4 flex flex-col gap-4">
          {/* horários abre / fecha / almoço em grid alinhado */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Abre</span>
              <input type="time" value={padrao.inicio} onChange={(e) => setPadrao((p) => ({ ...p, inicio: e.target.value }))} className={time} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Fecha</span>
              <input type="time" value={padrao.fim} onChange={(e) => setPadrao((p) => ({ ...p, fim: e.target.value }))} className={time} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1"><IconCoffee size={11} /> Almoço início</span>
              <input type="time" value={padrao.almocoInicio} onChange={(e) => setPadrao((p) => ({ ...p, almocoInicio: e.target.value }))} className={time} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Almoço fim</span>
              <input type="time" value={padrao.almocoFim} onChange={(e) => setPadrao((p) => ({ ...p, almocoFim: e.target.value }))} className={time} />
            </label>
          </div>

          {/* seletor de dias */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Dias</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDiasSel(new Set([1, 2, 3, 4, 5]))} className="text-[10px] text-[#b8944a] hover:underline">Seg–Sex</button>
                <button type="button" onClick={() => setDiasSel(new Set([0, 1, 2, 3, 4, 5, 6]))} className="text-[10px] text-[#b8944a] hover:underline">Todos</button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DIAS_SEMANA.map(({ dow, curto }) => {
                const sel = diasSel.has(dow);
                return (
                  <button key={dow} type="button" onClick={() => toggleDiaSel(dow)}
                    className={`w-10 py-1.5 text-xs rounded-md border transition ${sel ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-semibold" : "bg-[#0A0A0A] text-gray-400 border-[#2d2d2d] hover:border-[#b8944a]"}`}>{curto}</button>
                );
              })}
            </div>
          </div>

          <button type="button" onClick={aplicarPadrao} disabled={diasSel.size === 0 || aplicadoFeedback !== null}
            className={`w-full py-2 text-xs rounded-lg font-semibold transition disabled:opacity-40 flex items-center justify-center gap-1.5 ${
              aplicadoFeedback !== null
                ? "bg-green-500/20 text-green-300 border border-green-600/50"
                : "bg-[#b8944a] text-[#0A0A0A] hover:bg-[#c9a84c]"
            }`}>
            {aplicadoFeedback !== null ? (
              <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} className="flex items-center gap-1.5">
                <IconCheck size={13} strokeWidth={3} /> Aplicado a {aplicadoFeedback} dia{aplicadoFeedback !== 1 ? "s" : ""} — revise abaixo e salve
              </motion.span>
            ) : (
              <>Aplicar aos {diasSel.size} dia{diasSel.size !== 1 ? "s" : ""} selecionado{diasSel.size !== 1 ? "s" : ""}</>
            )}
          </button>
        </div>
      </div>

      {/* ── SEÇÃO: regras de agendamento (intervalo — carência entra no Bloco F) ── */}
      <div className="px-5 py-4 border-b border-[#1e1e1e] flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#b8944a] uppercase tracking-widest">Regras de agendamento</span>
          <span className="h-px flex-1 bg-[#1e1e1e]" />
        </div>

        <div className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A] p-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#F5E6C8] flex items-center gap-1.5"><IconClock size={13} className="text-[#b8944a]" /> Intervalo entre horários</span>
          <div className="flex items-center gap-2 mt-1">
            <motion.input
              ref={passoRef}
              type="text" inputMode="numeric"
              value={passoStr}
              onChange={(e) => { setPassoStr(e.target.value.replace(/\D/g, "").slice(0, 3)); setPassoErro(false); }}
              animate={passoErro ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={`w-16 text-center bg-[#111] border rounded-lg px-2 py-2 text-sm text-[#F5E6C8] focus:outline-none transition-colors ${
                passoErro ? "border-red-500 text-red-400" : passoValido ? "border-[#2d2d2d] focus:border-[#b8944a]" : "border-red-500/60"
              }`}
            />
            <span className="text-xs text-gray-500">minutos</span>
          </div>
          <p className={`text-[10px] ${passoErro ? "text-red-400" : "text-gray-600"}`}>
            {passoErro
              ? `Digite um valor entre ${PASSO_MIN} e ${PASSO_MAX} minutos.`
              : `De quanto em quanto tempo os horários aparecem ao cliente. Entre ${PASSO_MIN} e ${PASSO_MAX} min (ex: 13 → 9:00, 9:13, 9:26…).`}
          </p>
        </div>

        <div className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A] p-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#F5E6C8] flex items-center gap-1.5"><IconClock size={13} className="text-[#b8944a]" /> Tolerância de fechamento</span>
          <div className="flex items-center gap-2 mt-1">
            <motion.input
              ref={carenciaRef}
              type="text" inputMode="numeric"
              value={carenciaStr}
              onChange={(e) => { setCarenciaStr(e.target.value.replace(/\D/g, "").slice(0, 3)); setCarenciaErro(false); }}
              animate={carenciaErro ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={`w-16 text-center bg-[#111] border rounded-lg px-2 py-2 text-sm text-[#F5E6C8] focus:outline-none transition-colors ${
                carenciaErro ? "border-red-500 text-red-400" : carenciaValida ? "border-[#2d2d2d] focus:border-[#b8944a]" : "border-red-500/60"
              }`}
            />
            <span className="text-xs text-gray-500">minutos</span>
          </div>
          <p className={`text-[10px] ${carenciaErro ? "text-red-400" : "text-gray-600"}`}>
            {carenciaErro
              ? `Digite um valor entre 0 e ${CARENCIA_MAX} minutos.`
              : `Quanto um serviço pode passar do horário de fechamento. Ex: fecha 19:00, tolerância 30 → um corte de 45 min pode começar às 18:30 (termina 19:15). Use 0 para desativar.`}
          </p>
        </div>
      </div>

      {/* ── SEÇÃO: refinar cada dia individualmente ─────────────────────────── */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#b8944a] uppercase tracking-widest">Horário por dia</span>
          <span className="h-px flex-1 bg-[#1e1e1e]" />
        </div>

        <div className="flex flex-col gap-2">
          {DIAS_SEMANA.map(({ dow, nome }) => {
            const d = draft[dow];
            return (
              <div key={dow} className={`rounded-xl border p-3.5 flex flex-col gap-3 transition-colors ${d.ativo ? "border-[#2d2d2d] bg-[#0A0A0A]" : "border-[#1a1a1a] bg-[#0A0A0A]/40"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${d.ativo ? "text-[#F5E6C8]" : "text-gray-600"}`}>{nome}</span>
                  <button type="button" onClick={() => upd(dow, { ativo: !d.ativo })}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${d.ativo ? "bg-[#b8944a]" : "bg-[#2d2d2d]"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${d.ativo ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
                {d.ativo ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">Abre</span>
                      <input type="time" value={d.inicio} onChange={(e) => upd(dow, { inicio: e.target.value })} className={time} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">Fecha</span>
                      <input type="time" value={d.fim} onChange={(e) => upd(dow, { fim: e.target.value })} className={time} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1"><IconCoffee size={11} /> Almoço início</span>
                      <input type="time" value={d.almocoInicio ?? ""} onChange={(e) => upd(dow, { almocoInicio: e.target.value || null })} className={time} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">Almoço fim</span>
                      <input type="time" value={d.almocoFim ?? ""} onChange={(e) => upd(dow, { almocoFim: e.target.value || null })} className={time} />
                    </label>
                  </div>
                ) : (
                  <span className="text-xs text-gray-600">Fechado neste dia</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="px-5 py-4 border-t border-[#1e1e1e] flex flex-col gap-3 shrink-0">
        {conflitos.length > 0 ? (
          // Alerta VERMELHO: a mudança deixa agendamentos já efetuados fora do horário
          <div className="flex items-start gap-2 text-[11px] text-red-300 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2.5">
            <IconAlertTriangle size={14} className="shrink-0 mt-0.5 text-red-400" />
            <div className="flex flex-col gap-1 min-w-0">
              <span>
                <strong>{conflitos.length} agendamento{conflitos.length !== 1 ? "s" : ""} já efetuado{conflitos.length !== 1 ? "s" : ""}</strong> {conflitos.length !== 1 ? "ficam" : "fica"} fora do novo horário de funcionamento.
              </span>
              <span className="text-red-300/70">
                Eles <strong>não serão cancelados</strong>, mas passam a ficar fora da grade. Reagende ou avise os clientes:
                {" "}{conflitos.slice(0, 3).map((c) => `${c.nome} (${new Date(c.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${c.horario})`).join(", ")}{conflitos.length > 3 ? ` +${conflitos.length - 3}` : ""}.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
            <IconAlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-400" />
            <span>Ao salvar, os horários passam a valer <strong>na hora</strong> para os clientes no site. Confira antes de confirmar.</span>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">Cancelar</button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className={`px-4 py-2 text-sm rounded transition disabled:opacity-40 flex items-center gap-1.5 ${
              confirmandoConflito
                ? "bg-red-900/60 text-red-200 border border-red-700/60 hover:bg-red-900/80"
                : "text-[#0A0A0A] bg-[#b8944a] hover:bg-[#c9a84c]"
            }`}
          >
            {confirmandoConflito && <IconAlertTriangle size={13} />}
            {salvando ? "Salvando..." : confirmandoConflito ? "Salvar mesmo assim" : "Salvar grade"}
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
}

// Feedback positivo do app: check animado + mensagem, dentro de um modal centralizado.
function SucessoModal({ open, mensagem, onClose }: { open: boolean; mensagem: string; onClose: () => void }) {
  return (
    <AnimatedModal open={open} onClose={onClose} className="bg-[#141414] border border-green-700/40 rounded-2xl shadow-2xl px-8 py-9 max-w-[17rem] w-full mx-4 flex flex-col items-center gap-4">
      <motion.div
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
        className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center"
      >
        <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.18, type: "spring", stiffness: 500, damping: 16 }}>
          <IconCheck size={40} strokeWidth={3} className="text-green-400" />
        </motion.span>
      </motion.div>
      <p className="text-base font-bold text-[#F5E6C8] text-center leading-snug">{mensagem}</p>
    </AnimatedModal>
  );
}

export default function AgendamentosAdminPage() {
  const hoje = new Date();
  const hojeKey = toDateKey(hoje);
  const [dataSelecionada, setDataSelecionada] = useState(hojeKey);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);
  const [fechandoCaixa, setFechandoCaixa] = useState(false);
  const [caixaFechado, setCaixaFechado] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [slotsBloqueados, setSlotsBloqueados] = useState<string[]>([]);
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [agendarPre, setAgendarPre] = useState<{ data: string; horario: string } | null>(null);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Item[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [reagendarAg, setReagendarAg] = useState<Agendamento | null>(null);
  // Confirmação antes de ir editar a comanda no Caixa (a partir do lápis da grade).
  const [confirmarEditarComanda, setConfirmarEditarComanda] = useState<Agendamento | null>(null);
  const [notificacaoLink, setNotificacaoLink] = useState<string | null>(null);
  const [aba, setAba] = useState<"lista" | "grade">("lista");
  // No mobile a lista começa retraída (só cabeçalho); no desktop fica sempre aberta.
  const [listaMobileAberta, setListaMobileAberta] = useState(false);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [alertasExpandidos, setAlertasExpandidos] = useState<Set<string>>(new Set());
  const [grade, setGrade] = useState<GradeConfig>(GRADE_DEFAULT);
  const [passoMin, setPassoMin] = useState<number>(PASSO_DEFAULT);
  const [carenciaMin, setCarenciaMin] = useState<number>(CARENCIA_DEFAULT);
  const [configGradeOpen, setConfigGradeOpen] = useState(false);
  const [salvandoGrade, setSalvandoGrade] = useState(false);
  const [pendencias, setPendencias] = useState<Agendamento[] | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  // Modal explicativo do "confirmado automaticamente" (tira a poluição do card).
  const [autoInfoOpen, setAutoInfoOpen] = useState(false);
  // Âncora da agenda mobile (pra scroll/scroll-margin).
  const agendaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function mostrarSucesso(msg: string) {
    setSucesso(msg);
    setTimeout(() => setSucesso(null), 1500);
  }

  // Abre o modal de agendar. Sem args = do zero (FAB); com data/horário = pré-selecionado (grade).
  function abrirAgendar(pre?: { data: string; horario: string }) {
    setAgendarPre(pre ?? null);
    setAgendarOpen(true);
  }

  // Mantém o conteúdo do modal montado durante a animação de saída.
  // Ao abrir, atualiza com o valor atual + uma key nova (reseta o form).
  const [reagendarRender, setReagendarRender] = useState<{ ag: Agendamento; key: number } | null>(null);
  useEffect(() => {
    if (reagendarAg) setReagendarRender({ ag: reagendarAg, key: Date.now() });
  }, [reagendarAg]);

  function toggleAlerta(key: string) {
    setAlertasExpandidos((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  useEffect(() => {
    if (!scrollTarget || carregando) return;
    // garante que a lista esteja aberta (no mobile ela começa retraída)
    setListaMobileAberta(true);
    const id = scrollTarget;
    setScrollTarget(null);
    // adia o scroll pra depois da lista expandir (item alvo fica display:none até lá)
    setTimeout(() => {
      const el = document.getElementById(`ag-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-1", "ring-[#b8944a]");
        setTimeout(() => el.classList.remove("ring-1", "ring-[#b8944a]"), 2000);
      }
    }, 80);
  }, [scrollTarget, carregando]);

  function irParaAgendamento(ag: Agendamento) {
    setDataSelecionada(ag.data);
    setAba("lista");
    setEditandoId(null);
    setScrollTarget(ag.id);
  }


  // ── Ações do botão flutuante (+) ──
  // "Agendar horário" e "Grade de hoje" são disparadas via ?acao= (ver efeito abaixo),
  // para que o mesmo AdminFab funcione a partir de qualquer tela do admin.
  function fabAgendarHorario() {
    // FAB: abre o wizard do zero (cliente escolhe serviço/barbeiro/data/horário/dados)
    abrirAgendar();
  }

  function fabGradeHoje() {
    setDataSelecionada(hojeKey);
    setEditandoId(null);
    setTimeout(() => {
      document.getElementById("grade-horarios")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  // Dispara a ação do FAB quando chega de outra tela via ?acao=agendar|grade
  const searchParams = useSearchParams();
  useEffect(() => {
    if (carregando) return;
    const acao = searchParams.get("acao");
    if (acao !== "agendar" && acao !== "grade") return;
    if (acao === "agendar") fabAgendarHorario();
    if (acao === "grade") fabGradeHoje();
    // limpa o param pra não repetir ao dar refresh (scroll: false evita resetar
    // o scroll pro topo por cima do scrollIntoView do FAB)
    router.replace("/admin/agendamentos", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, searchParams]);

  function tempoAtras(ts: number): string {
    const diff = Date.now() - ts;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `há ${h}h${m > 0 ? ` ${m}min` : ""}`;
    return `há ${m}min`;
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    // parse resiliente: se a API falhar (ex.: 500 / cota Firestore), usa fallback
    // em vez de quebrar a página inteira com "Unexpected end of JSON input".
    const parse = async <T,>(res: Response, fallback: T): Promise<T> => {
      if (!res.ok) return fallback;
      try { return (await res.json()) as T; } catch { return fallback; }
    };
    const [resAgs, resFech, resBloq] = await Promise.all([
      fetch("/api/agendamentos", { credentials: "include" }).catch(() => null),
      fetch("/api/fechamento", { credentials: "include" }).catch(() => null),
      fetch(`/api/slots?data=${dataSelecionada}`, { credentials: "include" }).catch(() => null),
    ]);
    const agsData = resAgs ? await parse<unknown>(resAgs, []) : [];
    const fechsData = resFech ? await parse<unknown>(resFech, []) : [];
    const bloqData = resBloq ? await parse<{ bloqueados?: string[] }>(resBloq, { bloqueados: [] }) : { bloqueados: [] };
    const ags: Agendamento[] = Array.isArray(agsData) ? agsData : [];
    const fechs: FechamentoDia[] = Array.isArray(fechsData) ? fechsData : [];
    setAgendamentos(ags);
    setFechamentos(fechs);
    setSlotsBloqueados(bloqData.bloqueados ?? []);
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
    // helper: só faz .json() se a resposta veio OK e com corpo — evita
    // "Unexpected end of JSON input" quando a API retorna 401/500 vazio
    const getJson = async (url: string) => {
      try {
        const r = await fetch(url, { credentials: "include" });
        if (!r.ok) return null;
        const txt = await r.text();
        return txt ? JSON.parse(txt) : null;
      } catch {
        return null;
      }
    };
    getJson("/api/admin/barbeiros").then((d) => setBarbeiros(d?.barbeiros ?? []));
    getJson("/api/publico/servicos").then((d) => setServicos(d?.items ?? []));
    getJson("/api/admin/categorias-servicos").then((d) => setCategorias(d?.categorias ?? []));
    getJson("/api/grade").then((d) => { if (d?.grade) setGrade(mesclarGrade(d.grade)); if (d?.passoMin) setPassoMin(d.passoMin); if (d?.carenciaMin !== undefined) setCarenciaMin(d.carenciaMin); });
  }, []);

  const agsDia = agendamentos.filter((a) => a.data === dataSelecionada).sort((a, b) => a.horario.localeCompare(b.horario));
  const concluidos = agsDia.filter((a) => a.status === "concluido");
  const totalDia = concluidos.reduce((s, a) => s + parsePriceNum(a.preco), 0);
  const totalBarbeiros = barbeiros.length || 1;
  const todosSlotsDia = gerarSlotsData(dataSelecionada, grade, passoMin);
  // ocupação por slot considerando a DURAÇÃO de cada agendamento (não só o ponto de início).
  // Ex: corte 45min às 09:00 marca 09:00/09:15/09:30 como ocupados (passo 15).
  const ativosDia = agsDia.filter((a) => a.status !== "cancelado" && a.status !== "nao_compareceu");
  const ocupacaoPorSlot = new Map<string, number>();
  for (const a of ativosDia) {
    for (const s of slotsOcupadosPorAgendamento(a.horario, a.duracaoMin, passoMin)) {
      ocupacaoPorSlot.set(s, (ocupacaoPorSlot.get(s) ?? 0) + 1);
    }
  }
  // slot livre = ninguém agendado ali E não bloqueado E cabe pelo menos 1 barbeiro
  const slotsLivresDia = todosSlotsDia.filter(
    (s) => (ocupacaoPorSlot.get(s) ?? 0) < totalBarbeiros && !slotsBloqueados.includes(s)
  );

  const ehHoje = dataSelecionada === hojeKey;
  const ehFuturo = dataSelecionada > hojeKey;
  const diaFechado = todosSlotsDia.length === 0;
  // minutos do momento atual — usado pra marcar horários já passados como retroativos
  const agoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  const slotPassou = (slot: string) => {
    if (dataSelecionada < hojeKey) return true;   // dia inteiro no passado → tudo retroativo
    if (!ehHoje) return false;                    // dia futuro → nada passou
    return (Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3, 5))) < agoraMin; // hoje → só horários já passados
  };
  // Slots livres que AINDA dá pra agendar (exclui os que já passaram). Só esses fazem
  // sentido "bloquear" ao fechar o dia — bloquear horário já passado não bloqueia nada.
  const slotsLivresFuturos = slotsLivresDia.filter((s) => !slotPassou(s));

  const dataLabel = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const diaSemana = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long" });

  // notificar=false suprime a abertura do WhatsApp (ex.: "Desfazer" volta pra
  // confirmado mas NÃO deve reenviar a mensagem de confirmação ao cliente).
  async function atualizarStatus(id: string, status: AgendamentoStatus, notificar = true) {
    setProcessando(id);
    const res = await fetch(`/api/agendamentos/${id}`, { credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await res.json();
    setAgendamentos((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setProcessando(null);
    const msgStatus: Partial<Record<AgendamentoStatus, string>> = { concluido: "Atendimento concluído!", nao_compareceu: "Marcado como não compareceu", confirmado: "Agendamento confirmado!", cancelado: "Agendamento cancelado" };
    if (msgStatus[status]) mostrarSucesso(msgStatus[status]!);
    if (notificar && data.whatsappLink) window.open(data.whatsappLink, "_blank");
  }

  async function avisarCliente(id: string) {
    setProcessando(id);
    const res = await fetch(`/api/agendamentos/${id}/avisar`, { credentials: "include", method: "POST" });
    const data = await res.json();
    setAgendamentos((prev) => prev.map((a) => a.id === id ? { ...a, avisoPendente: false } : a));
    setProcessando(null);
    if (data.whatsappLink) window.open(data.whatsappLink, "_blank");
  }

  async function excluir(id: string) {
    await fetch(`/api/agendamentos/${id}`, { credentials: "include", method: "DELETE" });
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
    mostrarSucesso("Agendamento removido");
  }

  // Regra de rastreabilidade: só dá pra registrar retroativo com o caixa do dia ABERTO.
  // Se estiver fechado, reabre (DELETE do fechamento) e já abre o walk-in do horário.
  async function reabrirCaixaERegistrar(horario: string) {
    const fech = fechamentos.find((f) => f.data === dataSelecionada);
    if (fech) {
      await fetch(`/api/fechamento/${fech.id}`, { method: "DELETE", credentials: "include" });
      setFechamentos((prev) => prev.filter((f) => f.id !== fech.id));
    }
    setCaixaFechado(false);
    abrirAgendar({ data: dataSelecionada, horario });
  }

  async function fecharCaixa() {
    if (caixaFechado) return;
    setFechandoCaixa(true);
    const res = await fetch("/api/fechamento", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: dataSelecionada }) });
    if (res.ok || res.status === 409) { setCaixaFechado(true); mostrarSucesso("Caixa fechado!"); }
    setFechandoCaixa(false);
  }

  async function toggleBloquearSlot(horario: string) {
    const jaBloqueado = slotsBloqueados.includes(horario);
    await fetch("/api/slots", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: dataSelecionada, horario, acao: jaBloqueado ? "desbloquear" : "bloquear" }) });
    setSlotsBloqueados((prev) => jaBloqueado ? prev.filter((s) => s !== horario) : [...prev, horario]);
    mostrarSucesso(jaBloqueado ? `Horário ${horario} liberado` : `Horário ${horario} bloqueado`);
  }

  async function criarAgendamento(dados: { nome: string; telefone: string; servico: string; preco: string; data: string; horario: string; duracaoMin?: number; barbeiroId?: string; barbeiroNome?: string; usarCredito?: boolean; assinaturaId?: string; cupom?: string | null }) {
    const body: Record<string, unknown> = {
      ...dados,
      telefone: dados.telefone || "00000000000",
    };
    if (dados.usarCredito && dados.assinaturaId) {
      body.assinaturaId = dados.assinaturaId;
      body.cobertoPorAssinatura = true;
    }
    const res = await fetch("/api/agendamentos", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const { id } = await res.json();
    await fetch(`/api/agendamentos/${id}`, { credentials: "include", method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "confirmado" }) });
    carregar();
    mostrarSucesso("Agendamento criado!");
  }

  async function reagendar(novaData: string, novoHorario: string) {
    if (!reagendarAg) return;
    const agId = reagendarAg.id;
    const res = await fetch(`/api/agendamentos/${reagendarAg.id}`, { credentials: "include", method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: novaData, horario: novoHorario }) });
    const data = await res.json();
    setReagendarAg(null);
    // se veio do painel de pendências (fechar o dia), remove o que já foi resolvido
    setPendencias((prev) => { if (!prev) return prev; const rest = prev.filter((p) => p.id !== agId); return rest.length ? rest : null; });
    carregar();
    mostrarSucesso("Reagendamento efetuado!");
    // o popup de notificar o cliente aparece depois do modal de sucesso
    if (data.whatsappLink) setTimeout(() => setNotificacaoLink(data.whatsappLink), 1600);
  }

  // Fecha o dia: bloqueia todos os horários livres. Agendamentos existentes ficam
  // intactos; se houver, abre o painel de pendências pra reagendar um a um.
  async function fecharDia() {
    const livres = slotsLivresFuturos; // só bloqueia os que ainda dá pra agendar
    if (livres.length > 0) {
      await fetch("/api/slots/dia", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: dataSelecionada, horarios: livres, acao: "bloquear" }) });
      setSlotsBloqueados((prev) => Array.from(new Set([...prev, ...livres])));
    }
    const ativos = agsDia.filter((a) => a.status === "pendente" || a.status === "confirmado");
    if (ativos.length > 0) setPendencias(ativos);
    else mostrarSucesso(livres.length > 0 ? `Dia fechado — ${livres.length} horário(s) removido(s)` : "Dia fechado");
  }

  // Libera o dia: desbloqueia todos os horários bloqueados da data.
  async function liberarDia() {
    if (slotsBloqueados.length === 0) return;
    const qtd = slotsBloqueados.length;
    await fetch("/api/slots/dia", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: dataSelecionada, horarios: slotsBloqueados, acao: "desbloquear" }) });
    setSlotsBloqueados([]);
    mostrarSucesso(`Dia liberado — ${qtd} horário(s) disponível(is) de novo`);
  }

  async function salvarGrade(nova: GradeConfig, novoPasso: number, novaCarencia: number) {
    setSalvandoGrade(true);
    try {
      await fetch("/api/grade", { credentials: "include", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grade: nova, passoMin: novoPasso, carenciaMin: novaCarencia }) });
      setGrade(nova);
      setPassoMin(novoPasso);
      setCarenciaMin(novaCarencia);
      setConfigGradeOpen(false);
      mostrarSucesso("Grade salva!");
    } finally {
      setSalvandoGrade(false);
    }
  }

  function confirmarModal() {
    if (!modal) return;
    if (modal.tipo === "concluir" && modal.id) atualizarStatus(modal.id, "concluido");
    if (modal.tipo === "nao_compareceu" && modal.id) atualizarStatus(modal.id, "nao_compareceu");
    if (modal.tipo === "excluir" && modal.id) excluir(modal.id);
    if (modal.tipo === "fechar_caixa") fecharCaixa();
    if (modal.tipo === "bloquear" && modal.horario) toggleBloquearSlot(modal.horario);
    if (modal.tipo === "fechar_dia") { setModal({ tipo: "fechar_dia_2" }); return; } // dupla confirmação
    if (modal.tipo === "fechar_dia_2") { fecharDia(); setModal(null); return; }
    if (modal.tipo === "liberar_dia") liberarDia();
    if (modal.tipo === "caixa_fechado_retro" && modal.horario) { const h = modal.horario; setModal(null); reabrirCaixaERegistrar(h); return; }
    setModal(null);
  }

  const agsAtivosDia = agsDia.filter((a) => a.status === "pendente" || a.status === "confirmado");

  const modalConfig = {
    concluir: { titulo: "Marcar como concluído?", mensagem: "Será incluído no caixa do dia.", confirmLabel: "Concluir", confirmClass: "bg-green-700 hover:bg-green-600" },
    nao_compareceu: { titulo: "Marcar como não compareceu?", mensagem: "O horário será liberado e a comanda vinculada será cancelada. Você pode desfazer depois.", confirmLabel: "Não compareceu", confirmClass: "bg-[#2d2d2d] hover:bg-[#3d3d3d]" },
    excluir: { titulo: "Remover agendamento?", mensagem: "Esta ação remove o agendamento da lista.", confirmLabel: "Remover", confirmClass: "bg-red-600 hover:bg-red-500" },
    fechar_caixa: { titulo: "Fechar o caixa do dia?", mensagem: `${concluidos.length} serviços · R$ ${totalDia.toFixed(2).replace(".", ",")}`, confirmLabel: "Fechar caixa", confirmClass: "bg-[#b8944a] hover:bg-[#c9a84c] text-[#0A0A0A]" },
    bloquear: {
      titulo: modal?.horario && slotsBloqueados.includes(modal.horario) ? "Desbloquear horário?" : "Bloquear horário?",
      mensagem: modal?.horario && slotsBloqueados.includes(modal.horario) ? `Horário ${modal.horario} voltará a estar disponível.` : `Horário ${modal?.horario} ficará indisponível para clientes.`,
      confirmLabel: modal?.horario && slotsBloqueados.includes(modal.horario) ? "Desbloquear" : "Bloquear",
      confirmClass: "bg-[#2d2d2d] hover:bg-[#3d3d3d]",
    },
    fechar_dia: {
      titulo: "Fechar este dia?",
      mensagem: `Bloqueia os ${slotsLivresFuturos.length} horário(s) livre(s) restante(s) de ${dataLabel} — ninguém mais conseguirá agendar. Os agendamentos já existentes serão mantidos.`,
      confirmLabel: "Continuar",
      confirmClass: "bg-red-700 hover:bg-red-600",
    },
    fechar_dia_2: {
      titulo: "Tem certeza?",
      mensagem: agsAtivosDia.length > 0
        ? `Ação definitiva. Em seguida você poderá reagendar os ${agsAtivosDia.length} agendamento(s) deste dia, um a um.`
        : "Esta ação bloqueia o dia inteiro. Deseja continuar?",
      confirmLabel: "Fechar o dia",
      confirmClass: "bg-red-600 hover:bg-red-500",
    },
    liberar_dia: {
      titulo: "Liberar este dia?",
      mensagem: `Desbloqueia os ${slotsBloqueados.length} horário(s) bloqueado(s) de ${dataLabel} — o dia volta a aceitar agendamentos.`,
      confirmLabel: "Liberar dia",
      confirmClass: "bg-green-700 hover:bg-green-600",
    },
    caixa_fechado_retro: {
      titulo: "Caixa deste dia está fechado",
      mensagem: `Para manter a rastreabilidade, não dá pra registrar um agendamento retroativo em ${dataLabel} com o caixa já fechado. Reabra o caixa do dia para registrar (você poderá fechá-lo de novo depois).`,
      confirmLabel: "Reabrir caixa e registrar",
      confirmClass: "bg-[#b8944a] hover:bg-[#c9a84c] text-[#0A0A0A]",
    },
  };

  // Config exibida durante a animação de saída, quando `modal` já é null
  const modalConfigVazio = { titulo: "", mensagem: "", confirmLabel: "", confirmClass: "" };

  const cardDark = "bg-[#111] border border-[#2d2d2d] rounded-xl";

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">
      <AdminFab />

      {/* Feedback de sucesso (reagendar, bloquear/liberar horário, fechar/liberar dia) */}
      <SucessoModal open={!!sucesso} mensagem={sucesso ?? ""} onClose={() => setSucesso(null)} />

      <Modal open={!!modal} {...(modal ? modalConfig[modal.tipo] : modalConfigVazio)} onConfirm={confirmarModal} onCancel={() => setModal(null)} />
      <ConfigGradeModal open={configGradeOpen} grade={grade} passoMin={passoMin} carenciaMin={carenciaMin} salvando={salvandoGrade} agendamentos={agendamentos} onSave={salvarGrade} onClose={() => setConfigGradeOpen(false)} />

      {/* Explicação do selo "auto" — tira o texto longo de dentro do card */}
      <AnimatedModal open={autoInfoOpen} onClose={() => setAutoInfoOpen(false)} className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-3">
        <h3 className="font-bold text-[#F5E6C8] flex items-center gap-2 pr-6"><IconCircleCheck size={16} className="text-green-400 shrink-0" /> Confirmado automaticamente</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          Este agendamento foi confirmado sozinho pelo sistema — pelo modo automático ou por tempo de espera — sem alguém clicar em confirmar.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Quando o selo aparecer em <span className="text-amber-300">amarelo com ⚠️</span>, o cliente ainda não foi avisado. Use o botão <span className="text-green-300">Avisar no WhatsApp</span> no card para mandar a confirmação.
        </p>
        <button onClick={() => setAutoInfoOpen(false)} className="mt-1 self-end px-4 py-2 text-sm text-[#F5E6C8] bg-[#1f1f1f] border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition">Entendi</button>
      </AnimatedModal>

      {/* Modal de pendências: aparece ao fechar o dia que tinha agendamentos.
          Renderizado ANTES do ReagendarModal pra que este fique por cima ao reagendar. */}
      <AnimatedModal open={!!pendencias && pendencias.length > 0} onClose={() => setPendencias(null)} className="nice-scroll bg-[#141414] border border-amber-700/40 rounded-xl shadow-xl max-w-md w-full mx-4 flex flex-col">
        <div className="px-5 py-4 border-b border-[#1e1e1e] shrink-0">
          <h3 className="font-bold text-amber-300 flex items-center gap-2"><IconAlertTriangle size={15} /> Dia fechado</h3>
          <p className="text-xs text-gray-500 mt-0.5">{pendencias?.length ?? 0} agendamento(s) neste dia — mantenha no horário ou reagende, um a um.</p>
        </div>
        <div className="flex flex-col divide-y divide-[#1a1a1a] max-h-[55vh] overflow-y-auto">
          {(pendencias ?? []).map((ag) => (
            <div key={ag.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#F5E6C8] truncate">{ag.horario} · {ag.nome}</p>
                <p className="text-xs text-gray-500 truncate">{ag.servico}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setPendencias((prev) => { const rest = (prev ?? []).filter((p) => p.id !== ag.id); return rest.length ? rest : null; })}
                  className="px-2.5 py-1 text-xs text-gray-300 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition">Manter</button>
                <button onClick={() => setReagendarAg(ag)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded-lg hover:bg-[#b8944a]/10 transition"><IconCalendarPlus size={12} /> Reagendar</button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-[#1e1e1e] flex justify-end shrink-0">
          <button onClick={() => setPendencias(null)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#0A0A0A] bg-[#b8944a] hover:bg-[#c9a84c] rounded transition"><IconCheck size={14} /> Concluir</button>
        </div>
      </AnimatedModal>
      {/* Sempre montados (key força reset do form ao reabrir) — assim o AnimatePresence
          interno do Modal roda a animação de SAÍDA ao fechar. */}
      <AgendarModal open={agendarOpen} onClose={() => setAgendarOpen(false)} servicos={servicos} categorias={categorias} barbeiros={barbeiros} grade={grade} passoMin={passoMin} carenciaMin={carenciaMin} preData={agendarPre?.data ?? null} preHorario={agendarPre?.horario ?? null} onCriar={criarAgendamento} />
      {reagendarRender && (
        <ReagendarModal key={reagendarRender.key} open={!!reagendarAg} ag={reagendarRender.ag} dataSelecionada={dataSelecionada} agsDia={agsDia} slotsBloqueados={slotsBloqueados} grade={grade} passoMin={passoMin} carenciaMin={carenciaMin} onConfirm={reagendar} onCancel={() => setReagendarAg(null)} />
      )}
      <Modal
        open={!!confirmarEditarComanda}
        titulo="Editar no Caixa"
        mensagem={<>A edição da comanda acontece na tela de <strong className="text-[#F5E6C8]">Caixa</strong>, onde ficam os itens, produtos e valores. Deseja ir para lá agora?</>}
        confirmLabel="Ir para o Caixa"
        confirmClass="bg-[#b8944a] !text-[#0A0A0A] font-bold hover:bg-[#c9a55a]"
        onConfirm={() => { const ag = confirmarEditarComanda; setConfirmarEditarComanda(null); if (ag) router.push(`/admin/caixa?dia=${ag.data}&editarComanda=${ag.id}#comandas-abertas`); }}
        onCancel={() => setConfirmarEditarComanda(null)}
      />
      <AnimatePresence>
        {notificacaoLink && (
          <motion.div
            className="fixed top-20 md:top-6 right-4 md:right-6 z-[60] flex items-center gap-3 bg-[#1a2a1a] border border-green-700/60 text-green-300 rounded-xl px-4 py-3 shadow-xl max-w-xs"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <IconMessageCircle size={18} className="shrink-0 text-green-400" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Reagendamento salvo</span>
              <span className="text-xs text-green-400/70">Notifique o cliente pelo WhatsApp</span>
            </div>
            <div className="flex gap-2 ml-auto">
              <a href={notificacaoLink} target="_blank" rel="noreferrer" onClick={() => setNotificacaoLink(null)} className="text-xs bg-green-700 hover:bg-green-600 text-white rounded px-2 py-1 transition">Enviar</a>
              <button onClick={() => setNotificacaoLink(null)} className="text-xs text-gray-500 hover:text-gray-300 transition"><IconX size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Agendamentos</h1>
        <button onClick={carregar} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#b8944a] transition">
          <IconRefresh size={14} className={carregando ? "animate-spin" : ""} /> Atualizar
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
                  <IconAlertCircle size={13} className="shrink-0" />
                  <span className="flex-1 text-left">{atrasados.length} atendimento{atrasados.length > 1 ? "s" : ""} com horário passado sem conclusão</span>
                  <IconChevronDown size={13} className={`shrink-0 transition-transform ${alertasExpandidos.has("atrasados") ? "rotate-180" : ""}`} />
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
                  <IconClock size={13} className="shrink-0" />
                  <span className="flex-1">{a.nome} — {a.servico} em <strong>{mins} min</strong> ({a.horario})</span>
                  <span className="text-[10px] opacity-50 group-hover:opacity-100 transition shrink-0">ver →</span>
                </button>
              );
            })}

            {/* Novos não visualizados */}
            {naoVisualizados.length > 0 && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border bg-orange-950/40 border-orange-700/40 text-orange-300 text-xs font-medium">
                <IconBell size={13} className="shrink-0" />
                {naoVisualizados.length} novo{naoVisualizados.length > 1 ? "s" : ""} agendamento{naoVisualizados.length > 1 ? "s" : ""} aguardando confirmação
              </div>
            )}

            {/* Pendentes há mais de 2h */}
            {aguardandoLongos.length > 0 && atrasados.length === 0 && (
              <div className="rounded-lg border bg-yellow-950/40 border-yellow-700/40 overflow-hidden">
                <button onClick={() => toggleAlerta("aguardando")}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-yellow-300 hover:bg-yellow-900/20 transition">
                  <IconAlertTriangle size={13} className="shrink-0" />
                  <span className="flex-1 text-left">{aguardandoLongos.length} pendente{aguardandoLongos.length > 1 ? "s" : ""} há mais de 2h sem resposta</span>
                  <IconChevronDown size={13} className={`shrink-0 transition-transform ${alertasExpandidos.has("aguardando") ? "rotate-180" : ""}`} />
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

      {/* ── KPIs do dia selecionado (centralizados) ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${cardDark} p-4 text-center`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">Agendamentos</p>
          <p className="text-2xl font-bold text-[#F5E6C8]">{agsDia.length}</p>
          <p className="text-xs text-gray-500 mt-1 capitalize truncate">{diaSemana}, {new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
        </div>
        <div className={`${cardDark} p-4 text-center`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">Horários livres</p>
          <p className="text-2xl font-bold text-[#F5E6C8]">{slotsLivresDia.length}</p>
          <p className="text-xs text-gray-500 mt-1">de {todosSlotsDia.length} no dia</p>
        </div>
        <div className={`${cardDark} p-4 text-center`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">Faturado</p>
          <p className="text-2xl font-bold text-green-400">R$ {totalDia.toFixed(2).replace(".", ",")}</p>
          <p className="text-xs text-gray-500 mt-1">{concluidos.length} concluído{concluidos.length !== 1 ? "s" : ""}</p>
        </div>
        <div className={`${cardDark} p-4 flex flex-col items-center text-center`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-1">Caixa</p>
          <p className={`text-xl font-bold flex items-center justify-center gap-1.5 leading-tight ${caixaFechado ? "text-green-400" : "text-gray-300"}`}>
            {caixaFechado ? <><IconLock size={17} /> Fechado</> : <><IconLockOpen size={17} /> Em aberto</>}
          </p>
          {!ehFuturo && (
            <Link href={`/admin/caixa?dia=${dataSelecionada}#caixa`}
              className="mt-1 text-[10px] font-bold tracking-widest uppercase text-[#b8944a] hover:underline flex items-center gap-1">
              <IconTrendingUp size={10} /> Ver no caixa
            </Link>
          )}
        </div>
      </div>

      {/* Mobile: agenda no padrão do Caixa — recolhido mostra a SEMANA (sempre visível),
          o '‹ MÊS ANO ›' expande pro mês. No desktop o calendário fica fixo ao lado. */}
      <div ref={agendaRef} className="lg:hidden rounded-xl bg-[#111] border border-[#242424] px-4 py-4 scroll-mt-4">
        <CalendarioMensal
          semMoldura
          retratil
          dataSelecionada={dataSelecionada}
          agendamentos={agendamentos}
          fechamentos={fechamentos}
          slotsBloqueados={slotsBloqueados}
          onSelect={(key) => { setDataSelecionada(key); setEditandoId(null); }}
          onExpandir={(exp) => {
            // ao expandir pro mês, centraliza a agenda na tela (espera a animação assentar)
            if (exp) setTimeout(() => agendaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 280);
          }}
        />
      </div>

      {/* ── Calendário + Lista lado a lado ───────────────────────────────────── */}
      {/* items-stretch: no mobile a lista ocupa a largura total ao empilhar; no
          desktop a lista estica pra bater a altura do calendário (base alinhada). */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch">

        {/* calendário — no desktop fica ao lado; no mobile vai pro overlay abaixo */}
        <div className="hidden lg:block w-full lg:w-[420px] shrink-0">
          <CalendarioMensal
            dataSelecionada={dataSelecionada}
            agendamentos={agendamentos}
            fechamentos={fechamentos}
            slotsBloqueados={slotsBloqueados}
            onSelect={(key) => { setDataSelecionada(key); setEditandoId(null); }}
          />
        </div>

        {/* Lista do dia — no desktop a lista é absoluta e preenche a altura do
            calendário (base sempre alinhada, rola por dentro se passar). No mobile
            volta ao fluxo normal com altura pelo conteúdo (com teto de 70vh). */}
        <div className="flex-1 min-w-0 relative">
          {diaFechado ? (
            <div className={`${cardDark} text-sm text-gray-500 py-16 text-center w-full lg:absolute lg:inset-0`}>Barbearia fechada neste dia.</div>
          ) : (
            <div className={`${cardDark} overflow-hidden flex flex-col w-full lg:absolute lg:inset-0`}>
              {/* cabeçalho — no mobile funciona como toggle pra abrir/fechar a lista */}
              <button
                type="button"
                onClick={() => setListaMobileAberta((v) => !v)}
                aria-expanded={listaMobileAberta}
                className="flex items-center justify-between px-5 py-2.5 border-b border-[#1a1a1a] gap-2 shrink-0 text-left w-full lg:cursor-default"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#F5E6C8] flex items-center gap-2"><IconList size={14} className="shrink-0" /> Lista de horários marcados</p>
                  <p className="text-xs text-gray-500 capitalize truncate">
                    {ehHoje && <span className="text-[#b8944a] font-medium">Hoje · </span>}
                    {diaSemana}, {dataLabel} · {agsDia.length === 0 ? "nenhum agendamento" : `${agsDia.length} agendamento${agsDia.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <IconChevronDown size={18} className={`shrink-0 text-gray-500 transition-transform lg:hidden ${listaMobileAberta ? "rotate-180" : ""}`} />
              </button>

              {/* corpo colapsável (mobile) / sempre aberto (desktop) — anima via CSS */}
              <div className="lista-collapse" data-open={listaMobileAberta ? "true" : "false"}>
               <div className="lista-collapse-inner">
              {/* conteúdo com scroll */}
              <div className="overflow-y-auto flex-1 min-h-0">
                {carregando ? (
                  <div className="text-sm text-gray-500 py-12 text-center">Carregando...</div>
                ) : agsDia.length === 0 ? (
                  <div className="text-sm text-gray-500 py-12 text-center">
                    {ehFuturo ? "Nenhum agendamento para este dia ainda." : "Nenhum agendamento neste dia."}
                  </div>
                ) : (
                  <motion.div
                    className="flex flex-col gap-2 p-3"
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                    key={dataSelecionada}
                  >
                    {agsDia.map((ag) => {
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
                        <motion.div
                          key={ag.id} id={`ag-${ag.id}`}
                          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className={`bg-[#0d0d0d] border rounded-xl px-3 sm:px-4 py-3 transition-colors ${ehConcluido ? "border-green-900/40" : ag.status === "nao_compareceu" || ag.status === "cancelado" ? "border-[#242424] opacity-60" : "border-[#242424]"}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-[52px] flex flex-col items-center pt-0.5">
                              <span className="text-sm font-bold text-[#F5E6C8] tabular-nums leading-tight">{ag.horario}</span>
                              <span className="text-[10px] text-gray-600 tabular-nums leading-tight mt-0.5">{horarioFim}</span>
                            </div>
                            <div className="flex-1 min-w-0 flex gap-2">
                              <div className="flex-1 min-w-0">
                                <>
                                  <p className="text-sm font-semibold text-[#F5E6C8]">{ag.servico}</p>
                                  {/* cliente + telefone na MESMA linha (usa a largura, encurta o card) */}
                                  <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs">
                                    <span className="text-gray-500">Cliente: <span className="text-gray-300">{ag.nome}</span></span>
                                    {ag.telefone && ag.telefone !== "00000000000" && (
                                      <a href={`https://wa.me/55${ag.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-400 transition tabular-nums">{ag.telefone}</a>
                                    )}
                                  </div>
                                  {/* chips (barbeiro, cupom) na mesma faixa horizontal */}
                                  {(ag.barbeiroNome || ag.cupom) && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                      {ag.barbeiroNome && (
                                        <span className="text-xs px-2 py-0.5 bg-[#2d2d2d] text-gray-300 border border-[#3d3d3d] rounded-full">✂️ {ag.barbeiroNome}</span>
                                      )}
                                      {ag.cupom && (
                                        <span className="text-xs px-2 py-0.5 bg-[#b8944a]/10 text-[#b8944a] border border-[#b8944a]/30 rounded-full font-mono">
                                          🏷️ {ag.cupom}{ag.desconto ? ` −R$ ${ag.desconto.toFixed(2).replace(".", ",")}` : ""}
                                        </span>
                                      )}
                                    </div>
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
                                </>
                              </div>

                              {/* coluna direita: preço + status + selo auto (alinhados à direita) */}
                              <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                                {ag.preco && <span className="text-xs font-bold text-[#b8944a] tabular-nums whitespace-nowrap">R$ {ag.preco}</span>}
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_STYLE[ag.status]}`}>{STATUS_LABEL[ag.status]}</span>
                                {ag.confirmadoAuto && (
                                  <button
                                    type="button"
                                    onClick={() => setAutoInfoOpen(true)}
                                    title="O que significa confirmado automaticamente?"
                                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap transition ${ag.avisoPendente ? "bg-amber-950/40 text-amber-300 border-amber-700/50 hover:bg-amber-950/60" : "bg-[#1a1a1a] text-gray-500 border-[#2d2d2d] hover:text-gray-300 hover:border-[#3d3d3d]"}`}
                                  >
                                    {ag.avisoPendente && <IconAlertTriangle size={9} className="shrink-0" />}
                                    auto
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* aviso WhatsApp — largura total do card (fora da coluna espremida).
                              O botão vira só ícone quando o banner fica estreito (container query). */}
                          {editandoId !== ag.id && ag.avisoPendente && (
                            <div className="zap-aviso mt-3 flex flex-row items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-950/40 border border-amber-700/40">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <IconAlertTriangle size={12} className="text-amber-400 shrink-0" />
                                <span className="text-xs text-amber-300 truncate">Avise o cliente da confirmação.</span>
                              </div>
                              <button onClick={() => avisarCliente(ag.id)} disabled={ocupado} title="Avisar no WhatsApp" aria-label="Avisar no WhatsApp" className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-green-300 bg-green-900/30 border border-green-700/50 rounded-lg hover:bg-green-900/50 transition shrink-0"><IconMessageCircle size={12} className="shrink-0" /> <span className="zap-aviso-label whitespace-nowrap">Avisar no WhatsApp</span></button>
                            </div>
                          )}

                          {/* barra de ações — largura total do card, quebra em vez de rolar */}
                          {editandoId !== ag.id && !caixaFechado && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-[#1a1a1a]">
                              {ag.status === "pendente" && (
                                <button onClick={() => atualizarStatus(ag.id, "confirmado")} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-400 border border-blue-700/40 rounded-lg hover:bg-blue-900/20 transition whitespace-nowrap"><IconCheck size={12} /> Confirmar</button>
                              )}
                              {(ag.status === "confirmado" || ag.status === "pendente") && (
                                <button onClick={() => setModal({ tipo: "concluir", id: ag.id })} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-400 border border-green-700/40 rounded-lg hover:bg-green-900/20 transition whitespace-nowrap"><IconCircleCheck size={12} /> Concluir</button>
                              )}
                              {!finalizado && (
                                <button onClick={() => setReagendarAg(ag)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded-lg hover:bg-[#b8944a]/10 transition whitespace-nowrap"><IconCalendarPlus size={12} /> Reagendar</button>
                              )}
                              {(ag.status === "confirmado" || ag.status === "pendente") && (
                                <button onClick={() => setModal({ tipo: "nao_compareceu", id: ag.id })} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition whitespace-nowrap"><IconClock size={12} /> Não compareceu</button>
                              )}
                              {(ehConcluido || ag.status === "nao_compareceu") && (
                                <button onClick={() => atualizarStatus(ag.id, "confirmado", false)} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition whitespace-nowrap"><IconArrowBackUp size={12} /> Desfazer</button>
                              )}
                              <div className="flex items-center gap-1 ml-auto">
                                <button onClick={() => setModal({ tipo: "excluir", id: ag.id })} className="p-1.5 text-red-500/50 hover:text-red-400 border border-transparent hover:border-red-900/40 rounded-lg transition" title="Excluir"><IconTrash size={13} /></button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              {/* rodapé */}
              {!ehFuturo && (
                <div className="px-4 py-2 border-t border-[#1a1a1a] flex items-center justify-between gap-3 flex-wrap shrink-0">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    {caixaFechado && <IconLock size={11} className="text-green-400" />}
                    {caixaFechado ? <span className="text-green-400">Caixa fechado · </span> : null}
                    {concluidos.length} concluídos · R$ {totalDia.toFixed(2).replace(".", ",")} faturados
                  </p>
                  <Link href={`/admin/caixa?dia=${dataSelecionada}&foco=comandas#comandas-abertas`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#b8944a]/40 text-[#b8944a] text-xs font-bold hover:border-[#b8944a] hover:bg-[#b8944a]/5 transition rounded-lg">
                    <IconReceipt size={12} /> Ir pra comandas
                  </Link>
                </div>
              )}
               </div>{/* fim lista-collapse-inner */}
              </div>{/* fim lista-collapse */}
            </div>
          )}
        </div>
      </div>{/* fim flex-row */}

      {/* ── Grade de horários ─────────────────────────────────────────────────── */}
      {!diaFechado && (
        <div id="grade-horarios" className={`${cardDark} overflow-hidden scroll-mt-20`}>
          <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#F5E6C8] flex items-center gap-2"><IconLayoutGrid size={14} /> Grade de horários</p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{diaSemana}, {dataLabel} · clique para agendar ou bloquear</p>
            </div>
            {!caixaFechado && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setConfigGradeOpen(true)} title="Configurar grade" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-300 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition">
                  <IconAdjustments size={13} /> <span className="hidden sm:inline">Configurar</span>
                </button>
                {slotsLivresFuturos.length > 0 && (
                  <button onClick={() => setModal({ tipo: "fechar_dia" })} title="Fechar o dia (bloquear horários livres restantes)" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400/80 border border-red-900/40 rounded-lg hover:border-red-500/60 hover:text-red-400 transition">
                    <IconCalendarX size={13} /> <span className="hidden sm:inline">Fechar dia</span>
                  </button>
                )}
                {slotsBloqueados.length > 0 && (
                  <button onClick={() => setModal({ tipo: "liberar_dia" })} title="Liberar o dia (desbloquear horários)" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-green-400/80 border border-green-900/40 rounded-lg hover:border-green-500/60 hover:text-green-400 transition">
                    <IconCalendarCheck size={13} /> <span className="hidden sm:inline">Liberar dia</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="overflow-y-auto max-h-[480px] divide-y divide-[#1a1a1a]">
            {todosSlotsDia.map((slot) => {
              // agendamentos que COMEÇAM neste slot (renderiza os cards aqui)
              const agsNoSlot = agsDia.filter((a) => a.horario === slot && a.status !== "cancelado");
              // quantos barbeiros estão ocupados NESTE slot considerando a duração dos agendamentos
              const ocupacaoNoSlot = ocupacaoPorSlot.get(slot) ?? 0;
              const bloqueado = slotsBloqueados.includes(slot);
              const cheio = !bloqueado && ocupacaoNoSlot >= totalBarbeiros;
              const livre = ocupacaoNoSlot === 0 && !bloqueado;
              // ocupado por duração de um agendamento que começou ANTES (não neste slot)
              const ocupadoPorAnterior = agsNoSlot.length === 0 && ocupacaoNoSlot > 0;
              return (
                <div key={slot} className={`flex gap-3 px-3 sm:px-4 py-3 transition-colors ${bloqueado ? "bg-[#0A0A0A]/60" : cheio ? "bg-red-950/[0.07]" : livre ? "hover:bg-white/[0.015]" : ""}`}>
                  {/* coluna do horário — chip alinhado ao topo */}
                  <div className="flex-shrink-0 w-14 flex flex-col items-center pt-0.5">
                    <span className={`text-sm font-bold tabular-nums ${livre && !slotPassou(slot) ? "text-[#F5E6C8]" : "text-gray-500"}`}>{slot}</span>
                    {!bloqueado && (
                      <span className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full border tabular-nums ${cheio ? "border-red-800/50 text-red-400/80 bg-red-950/30" : ocupacaoNoSlot > 0 ? "border-[#2d2d2d] text-gray-500" : "border-transparent text-gray-700"}`}>
                        {ocupacaoNoSlot}/{totalBarbeiros}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    {bloqueado ? (
                      <div className="flex items-center justify-between gap-2 py-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1.5"><IconBan size={13} className="text-red-500/70" /> Bloqueado</span>
                        {!caixaFechado && <button onClick={() => setModal({ tipo: "bloquear", horario: slot })} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition shrink-0"><IconLockOpen size={12} /> Desbloquear</button>}
                      </div>
                    ) : ocupadoPorAnterior && !cheio ? (
                      // slot dentro da duração de um agendamento que começou antes
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1.5"><IconClock size={12} className="text-gray-700" /> Em atendimento</span>
                      </div>
                    ) : livre ? (
                      <div className="flex items-center justify-between gap-2 py-1">
                        {slotPassou(slot) ? (
                          <span className="text-sm text-gray-500 flex items-center gap-1.5"><IconClock size={13} className="text-gray-600" /> Horário passado</span>
                        ) : (
                          <span className="text-sm text-green-500/70 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500/70" /> Disponível</span>
                        )}
                        <div className="flex gap-1 shrink-0">
                          {slotPassou(slot) ? (
                            // Retroativo: sempre visível. Com caixa fechado, avisa (regra de rastreabilidade).
                            <button onClick={() => caixaFechado ? setModal({ tipo: "caixa_fechado_retro", horario: slot }) : abrirAgendar({ data: dataSelecionada, horario: slot })}
                              title="Registrar atendimento retroativo (cliente que veio e não foi lançado)"
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition border text-gray-400 border-[#2d2d2d] hover:border-[#b8944a] hover:text-[#b8944a]">
                              <IconCalendarPlus size={12} /> <span className="hidden sm:inline">Registrar retroativo</span><span className="sm:hidden">Retroativo</span>
                            </button>
                          ) : !caixaFechado ? (
                            <>
                              <button onClick={() => abrirAgendar({ data: dataSelecionada, horario: slot })} className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition border text-[#b8944a] border-[#b8944a]/30 hover:bg-[#b8944a]/10"><IconCalendarPlus size={12} /> Agendar</button>
                              <button onClick={() => setModal({ tipo: "bloquear", horario: slot })} className="p-1.5 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-900/40 rounded-lg transition" title="Bloquear"><IconBan size={13} /></button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <>
                        {agsNoSlot.map((ag) => {
                          const ocupado = processando === ag.id;
                          const ehConcluido = ag.status === "concluido";
                          const finalizado = ehConcluido || ag.status === "nao_compareceu" || ag.status === "cancelado";
                          return (
                            <div key={ag.id} className={`bg-[#0d0d0d] border rounded-lg p-3 flex flex-col gap-2.5 ${ehConcluido ? "border-green-900/40" : ag.status === "nao_compareceu" ? "border-[#2a2a2a] opacity-70" : "border-[#2a2a2a]"}`}>
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[#F5E6C8] truncate">{ag.nome}</p>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">✂️ {ag.servico}{ag.barbeiroNome ? ` · ${ag.barbeiroNome}` : ""}</p>
                                  {ag.telefone && ag.telefone !== "00000000000" && (
                                    <a href={`https://wa.me/55${ag.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 hover:text-green-400 transition truncate block mt-0.5">{ag.telefone}</a>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  {ag.preco && <span className="text-xs font-bold text-[#b8944a]">R$ {ag.preco}</span>}
                                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_STYLE[ag.status]}`}>{STATUS_LABEL[ag.status]}</span>
                                </div>
                              </div>
                              {!caixaFechado && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-[#1a1a1a]">
                                  {ag.status === "pendente" && <button onClick={() => atualizarStatus(ag.id, "confirmado")} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-400 border border-blue-700/40 rounded-lg hover:bg-blue-900/20 transition"><IconCheck size={12} /> Confirmar</button>}
                                  {(ag.status === "confirmado" || ag.status === "pendente") && <button onClick={() => setModal({ tipo: "concluir", id: ag.id })} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-400 border border-green-700/40 rounded-lg hover:bg-green-900/20 transition"><IconCircleCheck size={12} /> Concluir</button>}
                                  {!finalizado && <button onClick={() => setReagendarAg(ag)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded-lg hover:bg-[#b8944a]/10 transition"><IconCalendarPlus size={12} /> Reagendar</button>}
                                  {(ag.status === "confirmado" || ag.status === "pendente") && <button onClick={() => setModal({ tipo: "nao_compareceu", id: ag.id })} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition"><IconClock size={12} /> Não compareceu</button>}
                                  {(ehConcluido || ag.status === "nao_compareceu") && <button onClick={() => atualizarStatus(ag.id, "confirmado", false)} disabled={ocupado} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-[#b8944a] transition"><IconArrowBackUp size={12} /> Desfazer</button>}
                                  <div className="flex items-center gap-1 ml-auto">
                                    {!finalizado && <button onClick={() => setConfirmarEditarComanda(ag)} className="p-1.5 text-gray-500 hover:text-gray-300 border border-transparent hover:border-[#2d2d2d] rounded-lg transition" title="Editar comanda no Caixa"><IconPencil size={13} /></button>}
                                    <button onClick={() => setModal({ tipo: "excluir", id: ag.id })} className="p-1.5 text-red-500/50 hover:text-red-400 border border-transparent hover:border-red-900/40 rounded-lg transition" title="Excluir"><IconTrash size={13} /></button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {!cheio && !caixaFechado && (
                          <button onClick={() => abrirAgendar({ data: dataSelecionada, horario: slot })} className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded hover:bg-[#b8944a]/10 transition self-start"><IconCalendarPlus size={12} /> Adicionar</button>
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
