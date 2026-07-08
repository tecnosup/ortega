"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { Item } from "@/lib/admin-items";
import type { Barbeiro } from "@/lib/barbeiros-types";
import { toDateKey } from "@/lib/date-utils";
import type { Agendamento } from "@/lib/agendamentos-types";
import { resolverDuracaoMin } from "@/lib/agendamentos-types";
import { gerarSlotsDia, calcularSlotsLivres, mesclarGrade, GRADE_DEFAULT, PASSO_DEFAULT, CARENCIA_DEFAULT, type GradeConfig } from "@/lib/grade";

const MESES =["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["D","S","T","Q","Q","S","S"];

type Step = "servico" | "barbeiro" | "calendario" | "confirmado";

interface Selecao {
  servico: string;
  preco: string;
  duracaoMin: number;
  data: Date | null;
  horario: string;
  barbeiroId: string | null;
  barbeiroNome: string | null;
}

function StepIndicator({ atual }: { atual: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            n < atual ? "bg-[#b8944a] text-[#0A0A0A]" :
            n === atual ? "bg-[#b8944a]/20 border border-[#b8944a] text-[#b8944a]" :
            "bg-[#1a1a1a] border border-[#2d2d2d] text-gray-600"
          }`}>
            {n < atual ? <Check size={12} /> : n}
          </div>
          {n < 3 && <div className={`w-6 h-px ${n < atual ? "bg-[#b8944a]" : "bg-[#2d2d2d]"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function ClienteAgendarPage() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [step, setStep] = useState<Step>("servico");
  const [servicos, setServicos] = useState<Item[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [perfil, setPerfil] = useState<{ nome: string; telefone: string } | null>(null);
  const [selecao, setSelecao] = useState<Selecao>({ servico: "", preco: "", duracaoMin: 0, data: null, horario: "", barbeiroId: null, barbeiroNome: null });
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [slotsOcupados, setSlotsOcupados] = useState<Record<string, string[]>>({});
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [agendamentoId, setAgendamentoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [grade, setGrade] = useState<GradeConfig>(GRADE_DEFAULT);
  const [passoMin, setPassoMin] = useState<number>(PASSO_DEFAULT);
  const [carenciaMin, setCarenciaMin] = useState<number>(CARENCIA_DEFAULT);

  useEffect(() => {
    fetch("/api/publico/servicos").then((r) => r.json()).then((d) => setServicos(d.items ?? []));
    fetch("/api/publico/barbeiros").then((r) => r.json()).then((d) => setBarbeiros(d.barbeiros ?? []));
    fetch("/api/grade").then((r) => r.json()).then((d) => {
      if (d.grade) setGrade(mesclarGrade(d.grade));
      if (d.passoMin) setPassoMin(d.passoMin);
      if (d.carenciaMin !== undefined) setCarenciaMin(d.carenciaMin);
    }).catch(() => {});
    fetch("/api/cliente/perfil").then((r) => r.json()).then((d) => {
      if (d.assinatura) {
        setPerfil({ nome: d.assinatura.clienteNome, telefone: d.assinatura.clienteTelefone ?? "" });
      }
    });
  }, []);

  const buscarSlots = useCallback(async (dateKey: string, barbeiroId: string | null) => {
    if (!barbeiroId) return; // barbeiro é obrigatório
    const cacheKey = `${dateKey}__${barbeiroId}`;
    if (slotsOcupados[cacheKey] !== undefined) return;
    setCarregandoSlots(true);
    try {
      // /api/slots já expande a duração de cada agendamento do barbeiro
      const res = await fetch(`/api/slots?data=${dateKey}&barbeiroId=${encodeURIComponent(barbeiroId)}`);
      const { bloqueados } = await res.json();
      setSlotsOcupados((prev) => ({ ...prev, [cacheKey]: bloqueados ?? [] }));
    } finally { setCarregandoSlots(false); }
  }, [slotsOcupados]);

  useEffect(() => {
    if (selecao.data) {
      const key = toDateKey(selecao.data.getFullYear(), selecao.data.getMonth(), selecao.data.getDate());
      buscarSlots(key, selecao.barbeiroId);
    }
  }, [selecao.data, selecao.barbeiroId, buscarSlots]);

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
    const cacheKey = selecao.barbeiroId ? `${dateKey}__${selecao.barbeiroId}` : dateKey;
    const ocupados = new Set(slotsOcupados[cacheKey] ?? []);
    const agora = new Date();
    const hojeKey = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
    // FONTE DA VERDADE: reserva o intervalo pela duração do serviço, respeita passo/carência/almoço
    return calcularSlotsLivres({
      dia: grade[diaSemana],
      passoMin,
      carenciaMin,
      duracaoMin: selecao.duracaoMin > 0 ? selecao.duracaoMin : passoMin,
      ocupados,
      agoraMin: dateKey === hojeKey ? agora.getHours() * 60 + agora.getMinutes() : undefined,
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

  async function confirmar() {
    if (!perfil || !selecao.data) return;
    setSalvando(true);
    setErro("");
    const dataKey = toDateKey(selecao.data.getFullYear(), selecao.data.getMonth(), selecao.data.getDate());
    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: perfil.nome,
        telefone: perfil.telefone,
        servico: selecao.servico,
        preco: selecao.preco,
        data: dataKey,
        horario: selecao.horario,
        duracaoMin: selecao.duracaoMin || undefined,
        barbeiroId: selecao.barbeiroId ?? undefined,
        barbeiroNome: selecao.barbeiroNome ?? undefined,
        email: undefined, // será verificado internamente pelo telefone
      }),
    });
    const data = await res.json();
    setSalvando(false);
    if (!res.ok) { setErro(data.error ?? "Erro ao agendar"); return; }
    setAgendamentoId(data.id);
    setStep("confirmado");
  }

  const dataKey = selecao.data ? toDateKey(selecao.data.getFullYear(), selecao.data.getMonth(), selecao.data.getDate()) : null;
  const slotsDisponiveis = selecao.data && dataKey ? getSlotsDisponiveis(dataKey, selecao.data.getDay()) : [];
  const dataFormatada = selecao.data
    ? selecao.data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    : null;

  // ── STEP: SERVIÇO ─────────────────────────────────────────────────────────
  if (step === "servico") {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <StepIndicator atual={1} />
          <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-2 block">Passo 1 de 3</span>
          <h1 className="text-xl font-bold text-[#F5E6C8] mt-1">Escolha o serviço</h1>
        </div>
        {servicos.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-10">Carregando...</p>
        ) : (
          <div className="flex flex-col gap-3">
            {servicos.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelecao((sel) => ({ ...sel, servico: s.titulo, preco: s.preco, duracaoMin: resolverDuracaoMin(s, passoMin) })); setStep("barbeiro"); }}
                className="text-left border border-[#2d2d2d] bg-[#111] p-4 rounded-xl hover:border-[#b8944a] hover:bg-[#b8944a]/5 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-[#F5E6C8] group-hover:text-[#b8944a] transition">{s.titulo}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{s.descricao}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {s.preco && <p className="text-[#b8944a] font-bold text-sm">R$ {s.preco}</p>}
                    {s.duracao && <p className="text-xs text-gray-600 mt-0.5">{s.duracao}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── STEP: BARBEIRO ────────────────────────────────────────────────────────
  if (step === "barbeiro") {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <StepIndicator atual={2} />
          <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-2 block">Passo 2 de 3</span>
          <h1 className="text-xl font-bold text-[#F5E6C8] mt-1">Escolha o barbeiro</h1>
        </div>
        <div className="flex flex-col gap-3">
          {barbeiros.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">Nenhum barbeiro disponível no momento.</p>
          )}
          {barbeiros.map((b) => (
            <button
              key={b.id}
              onClick={() => { setSelecao((s) => ({ ...s, barbeiroId: b.id, barbeiroNome: b.apelido ?? b.nome })); setStep("calendario"); }}
              className="text-left border border-[#2d2d2d] bg-[#111] p-4 rounded-xl hover:border-[#b8944a] transition group"
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
        <button onClick={() => setStep("servico")} className="text-sm text-gray-600 hover:text-[#b8944a] transition">← Voltar</button>
      </div>
    );
  }

  // ── STEP: CALENDÁRIO ──────────────────────────────────────────────────────
  if (step === "calendario") {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <StepIndicator atual={3} />
          <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-2 block">Passo 3 de 3</span>
          <h1 className="text-xl font-bold text-[#F5E6C8] mt-1">Data e horário</h1>
        </div>

        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#F5E6C8]">{selecao.servico}
              {selecao.preco && <span className="text-[#b8944a] ml-2">R$ {selecao.preco}</span>}
            </p>
            {selecao.barbeiroNome && <p className="text-xs text-gray-500 mt-0.5">com {selecao.barbeiroNome}</p>}
          </div>
          <button onClick={() => setStep("barbeiro")} className="text-xs text-gray-600 hover:text-[#b8944a] transition px-2 py-1">Trocar</button>
        </div>

        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#b8944a] rounded-lg transition">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-sm font-bold text-[#F5E6C8]">{MESES[mesAtual.getMonth()]} <span className="text-gray-500 font-normal">{mesAtual.getFullYear()}</span></h2>
            <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#b8944a] rounded-lg transition">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map((d, i) => (
              <div key={i} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : "text-gray-600"}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {diasCalendario.map((cell, i) => {
              const cellDate = new Date(cell.ano, cell.mes, cell.dia);
              cellDate.setHours(0, 0, 0, 0);
              const desabilitado = cellDate < hoje || !grade[cellDate.getDay()]?.ativo || !cell.atual;
              const key = toDateKey(cell.ano, cell.mes, cell.dia);
              const disp = cell.atual && !desabilitado ? getDisponibilidade(key, cellDate.getDay()) : null;
              const selecionado = selecao.data ? cellDate.getTime() === selecao.data.getTime() : false;
              return (
                <button
                  key={i}
                  disabled={desabilitado}
                  onClick={() => { const d = new Date(cell.ano, cell.mes, cell.dia); if (d >= hoje && d.getDay() !== 0) setSelecao((s) => ({ ...s, data: d, horario: "" })); }}
                  className={`relative flex flex-col items-center justify-center rounded-lg h-9 text-sm transition-all
                    ${!cell.atual ? "text-gray-800" : ""}
                    ${desabilitado && cell.atual ? "text-gray-700 cursor-not-allowed" : ""}
                    ${!desabilitado && cell.atual ? "text-[#F5E6C8] hover:bg-[#b8944a]/10 cursor-pointer" : ""}
                    ${selecionado ? "bg-[#b8944a] text-[#0A0A0A] hover:bg-[#b8944a]" : ""}
                  `}
                >
                  <span className={`text-xs font-medium ${selecionado ? "font-bold text-[#0A0A0A]" : ""}`}>{cell.dia}</span>
                  {disp && !selecionado && (
                    <span className={`mt-0.5 h-1 w-2.5 rounded-full ${disp === "livre" ? "bg-green-500" : disp === "parcial" ? "bg-yellow-500" : "bg-red-400"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selecao.data && (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-3 capitalize">{dataFormatada}</p>
            {carregandoSlots ? (
              <p className="text-sm text-gray-600 py-3 text-center">Carregando...</p>
            ) : slotsDisponiveis.length === 0 ? (
              <p className="text-sm text-gray-500 py-3 text-center">Sem horários. Escolha outra data.</p>
            ) : (
              // scroll interno: com passo pequeno a lista fica enorme no mobile
              <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto nice-scroll -mr-1 pr-1">
                {slotsDisponiveis.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelecao((s) => ({ ...s, horario: slot }))}
                    className={`py-2.5 text-sm rounded-lg border font-medium transition ${
                      selecao.horario === slot
                        ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]"
                        : "border-[#2d2d2d] text-[#F5E6C8] hover:border-[#b8944a]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}

        <div className="flex gap-3">
          <button onClick={() => setStep("barbeiro")} className="flex-1 py-3.5 border border-[#2d2d2d] text-sm text-gray-500 rounded-xl hover:border-[#b8944a] transition">
            ← Voltar
          </button>
          {selecao.data && selecao.horario && (
            <button
              onClick={confirmar}
              disabled={salvando}
              className="flex-1 py-3.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded-xl hover:bg-[#c9a84c] transition disabled:opacity-50"
            >
              {salvando ? "Agendando..." : "Confirmar"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── STEP: CONFIRMADO ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 items-center text-center">
      <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center text-2xl">✅</div>
      <div>
        <h1 className="text-xl font-bold text-[#F5E6C8]">Agendamento confirmado!</h1>
        <p className="text-gray-500 text-sm mt-1">Seu crédito foi utilizado. Te esperamos!</p>
      </div>
      <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 w-full text-left flex flex-col gap-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Serviço</span><span className="text-[#b8944a] font-medium">{selecao.servico}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Data</span><span className="text-[#F5E6C8] capitalize">{dataFormatada}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Horário</span><span className="text-[#F5E6C8]">{selecao.horario}</span></div>
        {selecao.barbeiroNome && <div className="flex justify-between"><span className="text-gray-500">Barbeiro</span><span className="text-[#F5E6C8]">{selecao.barbeiroNome}</span></div>}
        <div className="flex justify-between border-t border-[#2d2d2d] pt-2 mt-1"><span className="text-gray-500">Pagamento</span><span className="text-green-400 text-xs font-medium">Coberto pela assinatura</span></div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <a href="/cliente/agendamentos" className="w-full py-3 bg-[#b8944a] text-[#0A0A0A] font-bold rounded-xl text-sm text-center hover:bg-[#c9a84c] transition">
          Ver meus agendamentos
        </a>
        <button
          onClick={() => { setStep("servico"); setSelecao({ servico: "", preco: "", duracaoMin: 0, data: null, horario: "", barbeiroId: null, barbeiroNome: null }); setAgendamentoId(null); }}
          className="text-sm text-gray-600 hover:text-[#b8944a] transition"
        >
          Fazer outro agendamento
        </button>
      </div>
    </div>
  );
}
