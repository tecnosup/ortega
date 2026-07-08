"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  IconCheck, IconChevronLeft, IconChevronRight, IconTag,
} from "@tabler/icons-react";
import type { Item } from "@/lib/admin-items";
import { type Agendamento, resolverDuracaoMin, parsePriceNum } from "@/lib/agendamentos-types";
import type { Barbeiro } from "@/lib/barbeiros-types";
import { toDateKey } from "@/lib/date-utils";
import { gerarSlotsDia, servicoCabeNoDia, mesclarGrade, GRADE_DEFAULT, PASSO_DEFAULT, CARENCIA_DEFAULT, type GradeConfig } from "@/lib/grade";

const MESES =["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["D","S","T","Q","Q","S","S"];

const STATUS_CONFIG = {
  pendente: {
    label: "Aguardando confirmação",
    desc: "O Ortega vai revisar e confirmar em breve.",
    cor: "bg-yellow-900/20 border-yellow-600/40 text-yellow-300",
    icone: "⏳",
  },
  confirmado: {
    label: "Agendamento confirmado!",
    desc: "Seu horário está garantido. Te esperamos!",
    cor: "bg-[#b8944a]/10 border-[#b8944a]/40 text-[#b8944a]",
    icone: "✅",
  },
  cancelado: {
    label: "Agendamento cancelado",
    desc: "Entre em contato para reagendar.",
    cor: "bg-red-900/20 border-red-600/40 text-red-300",
    icone: "❌",
  },
};

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2.5 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition";

type Step = "servico" | "barbeiro" | "calendario" | "dados" | "confirmado";

interface Selecao {
  servico: string;
  preco: string;
  duracaoMin: number;
  data: Date | null;
  horario: string;
  nome: string;
  telefone: string;
  barbeiroId: string | null;
  barbeiroNome: string | null;
}

interface CupomAplicado {
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  desconto: number;
}

function StepIndicator({ atual }: { atual: 1 | 2 | 3 | 4 }) {
  const total = 4;
  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            n < atual ? "bg-[#b8944a] text-[#0A0A0A]" :
            n === atual ? "bg-[#b8944a]/20 border border-[#b8944a] text-[#b8944a]" :
            "bg-[#1a1a1a] border border-[#2d2d2d] text-gray-600"
          }`}>
            {n < atual ? <IconCheck size={12} /> : n}
          </div>
          {n < total && <div className={`w-6 h-px transition-all duration-300 ${n < atual ? "bg-[#b8944a]" : "bg-[#2d2d2d]"}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function AgendamentoPage() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [step, setStep] = useState<Step>("servico");
  const [servicos, setServicos] = useState<Item[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("5511999999999");
  const [selecao, setSelecao] = useState<Selecao>({
    servico: "", preco: "", duracaoMin: 0, data: null, horario: "", nome: "", telefone: "",
    barbeiroId: null, barbeiroNome: null,
  });
  // Parte D: múltiplos serviços (mesmo barbeiro, durações/preços somados)
  const [servicosSel, setServicosSel] = useState<Item[]>([]);

  function toggleServico(s: Item) {
    setServicosSel((prev) =>
      prev.some((x) => x.id === s.id) ? prev.filter((x) => x.id !== s.id) : [...prev, s]
    );
  }

  // deriva servico/preco/duracaoMin somados a partir da lista e avança
  function confirmarServicos() {
    if (servicosSel.length === 0) return;
    const nomes = servicosSel.map((s) => s.titulo).join(" + ");
    const precoTotal = servicosSel.reduce((acc, s) => acc + parsePriceNum(s.preco), 0);
    const duracaoTotal = servicosSel.reduce((acc, s) => acc + resolverDuracaoMin(s, passoMin), 0);
    // formata preço no padrão brasileiro "70,00" (se algum serviço tinha preço)
    const precoStr = precoTotal > 0 ? precoTotal.toFixed(2).replace(".", ",") : "";
    setSelecao((sel) => ({ ...sel, servico: nomes, preco: precoStr, duracaoMin: duracaoTotal, horario: "" }));
    setStep("barbeiro");
  }
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erros, setErros] = useState<{ nome?: string; telefone?: string; geral?: string }>({});
  const [salvando, setSalvando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [agendamentoId, setAgendamentoId] = useState<string | null>(null);
  const [statusAtual, setStatusAtual] = useState<Agendamento["status"]>("pendente");

  // slots ocupados por data (cache local)
  const [slotsOcupados, setSlotsOcupados] = useState<Record<string, string[]>>({});
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [grade, setGrade] = useState<GradeConfig>(GRADE_DEFAULT);
  const [passoMin, setPassoMin] = useState<number>(PASSO_DEFAULT);
  const [carenciaMin, setCarenciaMin] = useState<number>(CARENCIA_DEFAULT);

  // ref da seção de horários — usado para rolar até ela ao escolher o dia
  const horariosRef = useRef<HTMLDivElement>(null);
  // ref do botão "Continuar" — rola até ele ao escolher o horário
  const continuarRef = useRef<HTMLButtonElement>(null);

  // cupom
  const [codigoCupom, setCodigoCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<CupomAplicado | null>(null);
  const [erroCupom, setErroCupom] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);

  // busca serviços, barbeiros, settings e grade ao montar
  useEffect(() => {
    Promise.all([
      fetch("/api/publico/servicos").then((r) => r.json()).catch(() => ({ items: [] })),
      fetch("/api/publico/barbeiros").then((r) => r.json()).catch(() => ({ barbeiros: [] })),
      fetch("/api/publico/settings").then((r) => r.json()).catch(() => ({})),
      fetch("/api/grade").then((r) => r.json()).catch(() => ({})),
    ]).then(([dServicos, dBarbeiros, dSettings, dGrade]) => {
      setServicos(dServicos.items ?? []);
      setBarbeiros(dBarbeiros.barbeiros ?? []);
      if (dSettings.whatsappNumber) setWhatsappNumber(dSettings.whatsappNumber);
      if (dGrade.grade) setGrade(mesclarGrade(dGrade.grade));
      if (dGrade.passoMin) setPassoMin(dGrade.passoMin);
      if (dGrade.carenciaMin !== undefined) setCarenciaMin(dGrade.carenciaMin);
      setCarregandoDados(false);
    });
  }, []);

  // busca slots ocupados quando muda de data ou barbeiro
  const buscarSlots = useCallback(async (dateKey: string, barbeiroId: string | null) => {
    const cacheKey = barbeiroId ? `${dateKey}__${barbeiroId}` : dateKey;
    if (slotsOcupados[cacheKey] !== undefined) return;
    setCarregandoSlots(true);
    try {
      if (barbeiroId) {
        // API de slots já filtra horários ocupados do barbeiro específico
        const res = await fetch(`/api/slots?data=${dateKey}&barbeiroId=${encodeURIComponent(barbeiroId)}`);
        const { bloqueados } = await res.json();
        setSlotsOcupados((prev) => ({ ...prev, [cacheKey]: bloqueados ?? [] }));
      } else {
        // "qualquer": combina bloqueios globais + todos os agendamentos do dia
        const [slotsRes, agendRes] = await Promise.all([
          fetch(`/api/slots?data=${dateKey}`),
          fetch(`/api/agendamentos?data=${dateKey}`),
        ]);
        const { bloqueados } = await slotsRes.json();
        const agendData = await agendRes.json();
        const agendados = Array.isArray(agendData) ? agendData.map((a: Agendamento) => a.horario) : [];
        setSlotsOcupados((prev) => ({ ...prev, [cacheKey]: Array.from(new Set([...bloqueados, ...agendados])) }));
      }
    } finally {
      setCarregandoSlots(false);
    }
  }, [slotsOcupados]);

  useEffect(() => {
    if (selecao.data) {
      const key = toDateKey(selecao.data.getFullYear(), selecao.data.getMonth(), selecao.data.getDate());
      buscarSlots(key, selecao.barbeiroId);
    }
  }, [selecao.data, selecao.barbeiroId, buscarSlots]);

  const pollStatus = useCallback(async (id: string) => {
    const res = await fetch(`/api/agendamentos/${id}`);
    if (!res.ok) return;
    const data: Agendamento = await res.json();
    setStatusAtual(data.status);
  }, []);

  useEffect(() => {
    if (!agendamentoId || statusAtual === "cancelado") return;
    const interval = setInterval(() => pollStatus(agendamentoId), 5000);
    return () => clearInterval(interval);
  }, [agendamentoId, statusAtual, pollStatus]);

  const diasCalendario = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const dias: Array<{ dia: number; mes: number; ano: number; atual: boolean }> = [];
    const ultimoDiaMesAnterior = new Date(ano, mes, 0).getDate();
    for (let i = primeiroDia - 1; i >= 0; i--) {
      dias.push({ dia: ultimoDiaMesAnterior - i, mes: mes - 1, ano, atual: false });
    }
    for (let d = 1; d <= ultimoDia; d++) {
      dias.push({ dia: d, mes, ano, atual: true });
    }
    while (dias.length < 42) {
      dias.push({ dia: dias.length - primeiroDia - ultimoDia + 1, mes: mes + 1, ano, atual: false });
    }
    return dias;
  }, [mesAtual]);

  function getSlotsDisponiveis(dateKey: string, diaSemana: number): string[] {
    const todos = gerarSlotsDia(grade[diaSemana], passoMin);
    if (todos.length === 0) return [];
    const cacheKey = selecao.barbeiroId ? `${dateKey}__${selecao.barbeiroId}` : dateKey;
    const ocupados = new Set(slotsOcupados[cacheKey] ?? []);
    const agora = new Date();
    const hojeKey = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    // duração do serviço escolhido (fallback = 1 passo, comportamento antigo)
    const dur = selecao.duracaoMin > 0 ? selecao.duracaoMin : passoMin;
    const dia = grade[diaSemana];
    const fmt = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
    return todos.filter((s) => {
      const [h, m] = s.split(":").map(Number);
      const ini = h * 60 + m;
      if (dateKey === hojeKey && ini <= minutosAgora) return false;
      // cabe no expediente (fim + carência) e não atravessa o almoço
      if (!servicoCabeNoDia(s, dur, dia, carenciaMin)) return false;
      // não colide com nenhum agendamento existente no intervalo [ini, ini+dur)
      for (let t = ini; t < ini + dur; t += passoMin) {
        if (ocupados.has(fmt(t))) return false;
      }
      return true;
    });
  }

  function getDisponibilidade(dateKey: string, diaSemana: number): "livre" | "parcial" | "lotado" | "fechado" {
    const todos = gerarSlotsDia(grade[diaSemana], passoMin);
    if (todos.length === 0) return "fechado";
    const disponiveis = getSlotsDisponiveis(dateKey, diaSemana);
    if (disponiveis.length === 0) return "lotado";
    if (disponiveis.length < todos.length * 0.4) return "parcial";
    return "livre";
  }

  function selecionarData(dia: number, mes: number, ano: number) {
    const d = new Date(ano, mes, dia);
    if (d < hoje || !grade[d.getDay()]?.ativo) return;
    setSelecao((s) => ({ ...s, data: d, horario: "" }));
    // rola até os horários para o cliente perceber que precisa escolher o horário
    // (o timeout garante que a seção já renderizou com a data selecionada)
    // block: "start" deixa o título da data no topo da área visível (com scroll-mt
    // dando o respiro da navbar), em vez de centralizar a lista e cortar o cabeçalho
    setTimeout(() => {
      horariosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  async function aplicarCupom() {
    if (!codigoCupom.trim()) return;
    setValidandoCupom(true);
    setErroCupom("");
    const res = await fetch(`/api/cupons?codigo=${encodeURIComponent(codigoCupom.trim())}`);
    const data = await res.json();
    setValidandoCupom(false);
    if (!data.valido) {
      setCupomAplicado(null);
      setErroCupom(data.mensagem ?? "Cupom inválido");
      return;
    }
    const precoNum = parseFloat(selecao.preco.replace(",", ".")) || 0;
    const desconto = data.cupom.tipo === "percentual"
      ? parseFloat(((precoNum * data.cupom.valor) / 100).toFixed(2))
      : Math.min(data.cupom.valor, precoNum);
    setCupomAplicado({ codigo: data.cupom.codigo, tipo: data.cupom.tipo, valor: data.cupom.valor, desconto });
  }

  const precoFinal = (() => {
    const base = parseFloat(selecao.preco.replace(",", ".")) || 0;
    if (!cupomAplicado) return base;
    return Math.max(base - cupomAplicado.desconto, 0);
  })();

  async function confirmarAgendamento() {
    const e: { nome?: string; telefone?: string } = {};
    if (nome.trim().length < 2) e.nome = "Nome obrigatório";
    if (telefone.trim().length < 8) e.telefone = "Telefone obrigatório";
    if (Object.keys(e).length > 0) { setErros(e); return; }

    setSalvando(true);
    const dataKey = toDateKey(
      selecao.data!.getFullYear(),
      selecao.data!.getMonth(),
      selecao.data!.getDate()
    );
    const precoFinalStr = precoFinal > 0 ? precoFinal.toFixed(2).replace(".", ",") : selecao.preco;

    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, telefone,
          servico: selecao.servico,
          preco: precoFinalStr,
          cupom: cupomAplicado?.codigo ?? null,
          data: dataKey,
          horario: selecao.horario,
          duracaoMin: selecao.duracaoMin || undefined,
          barbeiroId: selecao.barbeiroId ?? undefined,
          barbeiroNome: selecao.barbeiroNome ?? undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Ocorreu um erro ao agendar. Tente novamente.");
      }

      const data = await res.json();
      setSelecao((s) => ({ ...s, nome, telefone }));
      setAgendamentoId(data.id);
      setStatusAtual("pendente");
      // invalida cache do slot que acabou de ser ocupado
      setSlotsOcupados((prev) => {
        const prev2 = { ...prev };
        delete prev2[dataKey];
        if (selecao.barbeiroId) {
          delete prev2[`${dataKey}__${selecao.barbeiroId}`];
        } else {
          // "qualquer": slot pode ter sido atribuído a qualquer barbeiro — invalida todos os caches deste dia
          for (const key of Object.keys(prev2)) {
            if (key.startsWith(`${dataKey}__`)) delete prev2[key];
          }
        }
        return prev2;
      });
      setStep("confirmado");
    } catch (err: any) {
      setErros({ geral: err.message });
    } finally {
      setSalvando(false);
    }
  }

  const dataKey = selecao.data
    ? toDateKey(selecao.data.getFullYear(), selecao.data.getMonth(), selecao.data.getDate())
    : null;

  const slotsDisponiveis = selecao.data && dataKey
    ? getSlotsDisponiveis(dataKey, selecao.data.getDay())
    : [];

  const dataFormatada = selecao.data
    ? selecao.data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    : null;

  // ── STEP: SERVIÇO ─────────────────────────────────────────────────────────
  if (step === "servico") {
    return (
      <section className="min-h-screen-safe pt-20 pb-10 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <StepIndicator atual={1} />
            <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-3 block">Passo 1 de 4</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5E6C8] mt-2">Escolha o serviço</h1>
          </div>
          <p className="text-center text-gray-500 text-xs mb-4 -mt-4">Você pode escolher mais de um serviço.</p>
          {carregandoDados ? (
            <p className="text-center text-gray-500 text-sm py-10">Carregando serviços...</p>
          ) : servicos.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-10">Nenhum serviço disponível no momento.</p>
          ) : (
            <>
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 pb-28">
                {servicos.map((s) => {
                  const marcado = servicosSel.some((x) => x.id === s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleServico(s)}
                      className={`text-left border p-4 sm:p-5 rounded-xl active:scale-[0.98] transition-all duration-200 group ${
                        marcado
                          ? "border-[#b8944a] bg-[#b8944a]/10"
                          : "border-[#2d2d2d] bg-[#111] hover:border-[#b8944a] hover:bg-[#b8944a]/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                            marcado ? "bg-[#b8944a] border-[#b8944a]" : "border-[#3d3d3d]"
                          }`}>
                            {marcado && <IconCheck size={13} className="text-[#0A0A0A]" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#F5E6C8] group-hover:text-[#b8944a] transition">{s.titulo}</p>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">{s.descricao}</p>
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
              </div>

              {/* barra fixa de resumo + continuar */}
              {servicosSel.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#2d2d2d] px-4 py-3 z-20">
                  <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <p className="text-[#F5E6C8] font-medium">
                        {servicosSel.length} serviço{servicosSel.length > 1 ? "s" : ""} • {servicosSel.reduce((a, s) => a + resolverDuracaoMin(s, passoMin), 0)} min
                      </p>
                      <p className="text-xs text-[#b8944a]">
                        R$ {servicosSel.reduce((a, s) => a + parsePriceNum(s.preco), 0).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <button
                      onClick={confirmarServicos}
                      className="px-6 py-3 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded-xl hover:bg-[#c9a84c] transition active:scale-[0.98]"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    );
  }

  // ── STEP: BARBEIRO ────────────────────────────────────────────────────────
  if (step === "barbeiro") {
    return (
      <section className="min-h-screen-safe pt-20 pb-10 bg-[#0A0A0A]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <StepIndicator atual={2} />
            <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-3 block">Passo 2 de 4</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5E6C8] mt-2">Escolha o barbeiro</h1>
            <p className="text-gray-500 text-sm mt-1">Ou deixe em branco para qualquer disponível</p>
          </div>

          <div className="flex flex-col gap-3">
            {/* opção "qualquer" */}
            <button
              onClick={() => {
                setSelecao((s) => ({ ...s, barbeiroId: null, barbeiroNome: null }));
                setStep("calendario");
              }}
              className={`text-left border rounded-xl p-4 sm:p-5 transition-all duration-200 active:scale-[0.98] hover:border-[#b8944a] hover:bg-[#b8944a]/5 group ${
                selecao.barbeiroId === null ? "border-[#b8944a] bg-[#b8944a]/5" : "border-[#2d2d2d] bg-[#111]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2d2d2d] flex items-center justify-center text-xl shrink-0">✂️</div>
                <div>
                  <p className="font-semibold text-[#F5E6C8] group-hover:text-[#b8944a] transition">Qualquer disponível</p>
                  <p className="text-xs text-gray-500 mt-0.5">O próximo barbeiro livre atende você</p>
                </div>
              </div>
            </button>

            {barbeiros.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelecao((s) => ({ ...s, barbeiroId: b.id, barbeiroNome: b.apelido ?? b.nome }));
                  setStep("calendario");
                }}
                className={`text-left border rounded-xl p-4 sm:p-5 transition-all duration-200 active:scale-[0.98] hover:border-[#b8944a] hover:bg-[#b8944a]/5 group ${
                  selecao.barbeiroId === b.id ? "border-[#b8944a] bg-[#b8944a]/5" : "border-[#2d2d2d] bg-[#111]"
                }`}
              >
                <div className="flex items-center gap-4">
                  {b.foto ? (
                    <img src={b.foto} alt={b.nome} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2d2d2d] flex items-center justify-center text-lg font-bold text-[#b8944a] shrink-0">
                      {b.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#F5E6C8] group-hover:text-[#b8944a] transition">{b.nome}</p>
                    {b.apelido && <p className="text-xs text-gray-500 mt-0.5">{b.apelido}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep("servico")}
            className="mt-6 text-sm text-gray-600 hover:text-[#b8944a] transition"
          >
            ← Voltar
          </button>
        </div>
      </section>
    );
  }

  // ── STEP: CALENDÁRIO ──────────────────────────────────────────────────────
  if (step === "calendario") {
    return (
      <section className="min-h-screen-safe pt-20 pb-10 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <StepIndicator atual={3} />
            <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-3 block">Passo 3 de 4</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5E6C8] mt-2">Data e horário</h1>
          </div>

          {/* serviço + barbeiro selecionado — pill no topo */}
          <div className="flex items-center justify-between bg-[#111] border border-[#2d2d2d] rounded-xl px-4 py-3 mb-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-gray-600 uppercase tracking-wider">Serviço</p>
              <p className="font-semibold text-[#F5E6C8] text-sm">{selecao.servico}
                {selecao.preco && <span className="text-[#b8944a] ml-2">R$ {selecao.preco}</span>}
              </p>
              {selecao.barbeiroNome && (
                <p className="text-xs text-gray-500">com {selecao.barbeiroNome}</p>
              )}
            </div>
            <button onClick={() => setStep("barbeiro")} className="text-xs text-gray-600 hover:text-[#b8944a] transition px-2 py-1">
              Trocar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 md:gap-6">
            {/* calendário */}
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#b8944a] hover:bg-[#b8944a]/10 rounded-lg transition"
                >
                  <IconChevronLeft size={20} />
                </button>
                <h2 className="text-base font-bold text-[#F5E6C8]">
                  {MESES[mesAtual.getMonth()]} <span className="text-gray-500 font-normal">{mesAtual.getFullYear()}</span>
                </h2>
                <button
                  onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#b8944a] hover:bg-[#b8944a]/10 rounded-lg transition"
                >
                  <IconChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA.map((d, i) => (
                  <div key={i} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : "text-gray-600"}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {diasCalendario.map((cell, i) => {
                  const cellDate = new Date(cell.ano, cell.mes, cell.dia);
                  cellDate.setHours(0, 0, 0, 0);
                  const passado = cellDate < hoje;
                  const fechado = !grade[cellDate.getDay()]?.ativo;
                  const desabilitado = passado || fechado || !cell.atual;
                  const key = toDateKey(cell.ano, cell.mes, cell.dia);
                  const disp = cell.atual && !desabilitado ? getDisponibilidade(key, cellDate.getDay()) : null;
                  const selecionado = selecao.data ? cellDate.getTime() === selecao.data.getTime() : false;

                  return (
                    <button
                      key={i}
                      disabled={desabilitado}
                      onClick={() => selecionarData(cell.dia, cell.mes, cell.ano)}
                      className={`relative flex flex-col items-center justify-center rounded-lg h-10 sm:h-11 text-sm transition-all duration-150 active:scale-95
                        ${!cell.atual ? "text-gray-800" : ""}
                        ${desabilitado && cell.atual ? "text-gray-700 cursor-not-allowed" : ""}
                        ${!desabilitado && cell.atual ? "text-[#F5E6C8] hover:bg-[#b8944a]/10 cursor-pointer" : ""}
                        ${selecionado ? "bg-[#b8944a] text-[#0A0A0A] hover:bg-[#b8944a]" : ""}
                      `}
                    >
                      <span className={`text-sm font-medium ${selecionado ? "text-[#0A0A0A] font-bold" : ""}`}>{cell.dia}</span>
                      {disp && !selecionado && (
                        <span className={`mt-0.5 h-1 w-3 rounded-full ${
                          disp === "livre" ? "bg-green-500" :
                          disp === "parcial" ? "bg-yellow-500" : "bg-red-400"
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#1a1a1a] text-xs text-gray-600">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-1 rounded-full bg-green-500" /> Disponível</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-1 rounded-full bg-yellow-500" /> Poucos horários</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-1 rounded-full bg-red-400" /> Lotado</span>
              </div>
            </div>

            {/* horários */}
            <div ref={horariosRef} className="flex flex-col gap-3 scroll-mt-24">
              {selecao.data ? (
                <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">
                    <span className="text-[#b8944a] normal-case font-medium capitalize">{dataFormatada}</span>
                  </p>
                  {carregandoSlots ? (
                    <p className="text-sm text-gray-600 py-4 text-center">Carregando...</p>
                  ) : slotsDisponiveis.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">Sem horários disponíveis.<br />Escolha outra data.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 gap-2">
                      {slotsDisponiveis.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => {
                            setSelecao((s) => ({ ...s, horario: slot }));
                            // rola até o botão "Continuar" (que só aparece agora)
                            setTimeout(() => {
                              continuarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }, 100);
                          }}
                          className={`py-2.5 text-sm rounded-lg transition-all border font-medium active:scale-95 ${
                            selecao.horario === slot
                              ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]"
                              : "border-[#2d2d2d] text-[#F5E6C8] hover:border-[#b8944a] hover:text-[#b8944a]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-600">Selecione uma data para ver os horários</p>
                </div>
              )}

              {selecao.data && selecao.horario && (
                <button
                  ref={continuarRef}
                  onClick={() => setStep("dados")}
                  className="w-full py-4 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded-xl hover:bg-[#c9a84c] transition active:scale-[0.98] scroll-mt-24"
                >
                  Continuar →
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── STEP: DADOS PESSOAIS ──────────────────────────────────────────────────
  if (step === "dados") {
    return (
      <section className="min-h-screen-safe pt-20 pb-10 bg-[#0A0A0A]">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <StepIndicator atual={4} />
            <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-3 block">Passo 4 de 4</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5E6C8] mt-2">Seus dados</h1>
          </div>

          {/* resumo compacto */}
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 mb-5 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Serviço</span>
              <span className="font-medium text-[#F5E6C8]">{selecao.servico}</span>
            </div>
            {selecao.barbeiroNome && (
              <div className="flex justify-between">
                <span className="text-gray-500">Barbeiro</span>
                <span className="font-medium text-[#F5E6C8]">{selecao.barbeiroNome}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Data</span>
              <span className="font-medium text-[#F5E6C8] capitalize">{dataFormatada}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Horário</span>
              <span className="font-medium text-[#F5E6C8]">{selecao.horario}</span>
            </div>
            {selecao.preco && (
              <div className="flex justify-between border-t border-[#2d2d2d] pt-2 mt-1">
                <span className="text-gray-500">Valor</span>
                <span className={`font-semibold ${cupomAplicado ? "line-through text-gray-600" : "text-[#b8944a]"}`}>
                  R$ {selecao.preco}
                </span>
              </div>
            )}
            {cupomAplicado && (
              <>
                <div className="flex justify-between text-green-400">
                  <span>Cupom <span className="font-mono font-bold">{cupomAplicado.codigo}</span></span>
                  <span>- R$ {cupomAplicado.desconto.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between border-t border-[#2d2d2d] pt-2 mt-1">
                  <span className="text-gray-400 font-medium">Total</span>
                  <span className="font-bold text-[#b8944a] text-base">R$ {precoFinal.toFixed(2).replace(".", ",")}</span>
                </div>
              </>
            )}
          </div>

          {/* cupom */}
          <div className="flex flex-col gap-2 mb-5">
            <label className="text-xs text-gray-600 font-medium uppercase tracking-wide flex items-center gap-1.5">
              <IconTag size={12} /> Cupom de desconto
            </label>
            <div className="flex gap-2">
              <input
                value={codigoCupom}
                onChange={(e) => { setCodigoCupom(e.target.value.toUpperCase()); setErroCupom(""); setCupomAplicado(null); }}
                placeholder="ex: ORTEGA10"
                disabled={!!cupomAplicado}
                className={`${inp} flex-1 font-mono text-sm disabled:opacity-50`}
              />
              {cupomAplicado ? (
                <button onClick={() => { setCupomAplicado(null); setCodigoCupom(""); }} className="px-3 py-2.5 text-xs text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/20 transition">
                  Remover
                </button>
              ) : (
                <button onClick={aplicarCupom} disabled={!codigoCupom.trim() || validandoCupom} className="px-4 py-2.5 text-sm bg-[#b8944a]/10 border border-[#b8944a]/40 text-[#b8944a] rounded-lg hover:bg-[#b8944a]/20 transition disabled:opacity-40">
                  {validandoCupom ? "..." : "Aplicar"}
                </button>
              )}
            </div>
            {erroCupom && <p className="text-xs text-red-400">{erroCupom}</p>}
            {cupomAplicado && <p className="text-xs text-green-400 font-medium">✓ Desconto de {cupomAplicado.tipo === "percentual" ? `${cupomAplicado.valor}%` : `R$ ${cupomAplicado.valor}`} aplicado</p>}
          </div>

          {/* formulário */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-400">Nome completo</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className={`${inp} ${erros.nome ? "border-red-500" : ""}`} />
              {erros.nome && <span className="text-xs text-red-400">{erros.nome}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-400">Telefone / WhatsApp</label>
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" inputMode="tel" className={`${inp} ${erros.telefone ? "border-red-500" : ""}`} />
              {erros.telefone && <span className="text-xs text-red-400">{erros.telefone}</span>}
            </div>
            {erros.geral && <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">{erros.geral}</div>}
            <div className="flex gap-3 mt-1">
              <button onClick={() => setStep("calendario")} className="flex-1 py-3.5 border border-[#2d2d2d] text-sm text-gray-500 rounded-xl hover:border-[#b8944a] hover:text-[#b8944a] transition active:scale-[0.98]">
                ← Voltar
              </button>
              <button onClick={confirmarAgendamento} disabled={salvando} className="flex-1 py-3.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded-xl hover:bg-[#c9a84c] transition disabled:opacity-50 active:scale-[0.98]">
                {salvando ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── STEP: CONFIRMADO + STATUS ─────────────────────────────────────────────
  const statusConfig = STATUS_CONFIG[statusAtual as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pendente;

  return (
    <section className="min-h-screen-safe pt-20 pb-10 bg-[#0A0A0A]">
      <div className="max-w-xl mx-auto px-4 sm:px-6 flex flex-col gap-4">
        <div className={`border rounded-lg p-5 flex items-start gap-4 ${statusConfig.cor}`}>
          <span className="text-2xl">{statusConfig.icone}</span>
          <div>
            <p className="font-semibold">{statusConfig.label}</p>
            <p className="text-sm mt-0.5 opacity-80">{statusConfig.desc}</p>
            {statusAtual === "pendente" && <p className="text-xs mt-2 opacity-60">Esta página atualiza automaticamente.</p>}
          </div>
        </div>

        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#F5E6C8]">Resumo do agendamento</h2>
          <div className="text-sm text-gray-500">
            <p>Nome: <strong className="text-[#F5E6C8]">{selecao.nome}</strong></p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg p-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Serviço</span>
              <span className="text-[#b8944a] font-medium">{selecao.servico}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Data</span>
              <span className="text-[#F5E6C8]">{dataFormatada}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Horário</span>
              <span className="text-[#F5E6C8]">{selecao.horario}</span>
            </div>
            {selecao.preco && (
              <div className="flex justify-between border-t border-[#2d2d2d] pt-2 mt-1">
                <span className="text-gray-500">Valor</span>
                <span className="text-[#b8944a] font-semibold">R$ {selecao.preco}</span>
              </div>
            )}
          </div>

          {statusAtual === "confirmado" && (
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Quero confirmar meu agendamento:\n*${selecao.servico}*\nData: ${dataFormatada}\nHorário: ${selecao.horario}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center px-6 py-3 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded-lg hover:bg-[#c9a84c] transition"
            >
              Falar pelo WhatsApp
            </a>
          )}
        </div>

        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={() => {
              setStep("servico");
              setSelecao({ servico: "", preco: "", duracaoMin: 0, data: null, horario: "", nome: "", telefone: "", barbeiroId: null, barbeiroNome: null });
              setServicosSel([]);
              setNome("");
              setTelefone("");
              setAgendamentoId(null);
              setStatusAtual("pendente");
            }}
            className="text-sm text-gray-600 hover:text-[#b8944a] transition"
          >
            Fazer outro agendamento
          </button>
          <a
            href={`/agendamento/status?tel=${encodeURIComponent(selecao.telefone)}`}
            className="text-sm text-gray-600 hover:text-[#b8944a] transition"
          >
            Ver todos os meus agendamentos →
          </a>
        </div>
      </div>
    </section>
  );
}
