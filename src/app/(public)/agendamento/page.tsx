"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HORARIO_FUNCIONAMENTO, AGENDAMENTOS_DEMO, demoServicos } from "@/lib/demo-data";
import type { Agendamento } from "@/lib/agendamentos";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function gerarSlots(inicio: string, fim: string): string[] {
  const slots: string[] = [];
  const [ih, im] = inicio.split(":").map(Number);
  const [fh, fm] = fim.split(":").map(Number);
  let mins = ih * 60 + im;
  const fimMins = fh * 60 + fm;
  while (mins + 30 <= fimMins) {
    slots.push(`${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
    mins += 30;
  }
  return slots;
}

function getSlotsDisponiveis(dateKey: string, diaSemana: number): string[] {
  const horario = HORARIO_FUNCIONAMENTO[diaSemana];
  if (!horario) return [];
  const todos = gerarSlots(horario.inicio, horario.fim);
  const ocupados = AGENDAMENTOS_DEMO[dateKey] ?? [];
  return todos.filter((s) => !ocupados.includes(s));
}

function getDisponibilidade(dateKey: string, diaSemana: number): "livre" | "parcial" | "lotado" | "fechado" {
  const horario = HORARIO_FUNCIONAMENTO[diaSemana];
  if (!horario) return "fechado";
  const todos = gerarSlots(horario.inicio, horario.fim);
  const disponiveis = getSlotsDisponiveis(dateKey, diaSemana);
  if (disponiveis.length === 0) return "lotado";
  if (disponiveis.length < todos.length * 0.4) return "parcial";
  return "livre";
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["D","S","T","Q","Q","S","S"];

const STATUS_CONFIG = {
  pendente: {
    label: "Aguardando confirmação",
    desc: "O Ortega vai revisar e confirmar em breve.",
    cor: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icone: "⏳",
  },
  confirmado: {
    label: "Agendamento confirmado!",
    desc: "Seu horário está garantido. Te esperamos!",
    cor: "bg-green-50 border-green-200 text-green-800",
    icone: "✅",
  },
  cancelado: {
    label: "Agendamento cancelado",
    desc: "Entre em contato para reagendar.",
    cor: "bg-red-50 border-red-200 text-red-800",
    icone: "❌",
  },
};

// ─── tipos ───────────────────────────────────────────────────────────────────

type Step = "servico" | "calendario" | "dados" | "confirmado";

interface Selecao {
  servico: string;
  preco: string;
  data: Date | null;
  horario: string;
  nome: string;
  telefone: string;
}

interface CupomAplicado {
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  desconto: number;
}

// ─── componente principal ────────────────────────────────────────────────────

export default function AgendamentoPage() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [step, setStep] = useState<Step>("servico");
  const [selecao, setSelecao] = useState<Selecao>({
    servico: "", preco: "", data: null, horario: "", nome: "", telefone: "",
  });
  const [mesAtual, setMesAtual] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erros, setErros] = useState<{ nome?: string; telefone?: string }>({});
  const [salvando, setSalvando] = useState(false);
  const [agendamentoId, setAgendamentoId] = useState<string | null>(null);
  const [statusAtual, setStatusAtual] = useState<Agendamento["status"]>("pendente");

  // cupom
  const [codigoCupom, setCodigoCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<CupomAplicado | null>(null);
  const [erroCupom, setErroCupom] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);

  // polling de status após agendamento criado
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

  // calendário
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

  function selecionarData(dia: number, mes: number, ano: number) {
    const d = new Date(ano, mes, dia);
    if (d < hoje || d.getDay() === 0) return;
    setSelecao((s) => ({ ...s, data: d, horario: "" }));
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

    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        telefone,
        servico: selecao.servico,
        preco: precoFinalStr,
        cupom: cupomAplicado?.codigo ?? null,
        data: dataKey,
        horario: selecao.horario,
      }),
    });

    const data = await res.json();
    setSalvando(false);
    setSelecao((s) => ({ ...s, nome, telefone }));
    setAgendamentoId(data.id);
    setStatusAtual("pendente");
    setStep("confirmado");
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

  // ── STEP: SERVIÇO ──────────────────────────────────────────────────────────
  if (step === "servico") {
    return (
      <section className="min-h-screen pt-28 pb-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-[#b8944a] text-sm font-medium tracking-widest uppercase">Passo 1 de 3</span>
            <h1 className="text-3xl font-bold text-[#1a1a1a] mt-2">Escolha o serviço</h1>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {demoServicos.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelecao((sel) => ({ ...sel, servico: s.titulo, preco: s.preco })); setStep("calendario"); }}
                className="text-left border border-gray-200 p-5 hover:border-[#b8944a] hover:bg-amber-50 transition group"
              >
                <p className="font-semibold text-[#1a1a1a] group-hover:text-[#b8944a] transition">{s.titulo}</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{s.descricao}</p>
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  {s.preco && <span className="text-[#b8944a] font-semibold">R$ {s.preco}</span>}
                  {s.duracao && <span>{s.duracao}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── STEP: CALENDÁRIO ───────────────────────────────────────────────────────
  if (step === "calendario") {
    return (
      <section className="min-h-screen pt-28 pb-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-[#b8944a] text-sm font-medium tracking-widest uppercase">Passo 2 de 3</span>
            <h1 className="text-3xl font-bold text-[#1a1a1a] mt-2">Escolha data e horário</h1>
          </div>

          <div className="grid md:grid-cols-[1fr_300px] gap-8">
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))} className="p-1 hover:text-[#b8944a] transition">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-bold text-[#1a1a1a]">
                  {MESES[mesAtual.getMonth()]} <span className="text-gray-400 font-normal">{mesAtual.getFullYear()}</span>
                </h2>
                <button onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))} className="p-1 hover:text-[#b8944a] transition">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DIAS_SEMANA.map((d, i) => (
                  <div key={i} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : "text-gray-400"}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {diasCalendario.map((cell, i) => {
                  const cellDate = new Date(cell.ano, cell.mes, cell.dia);
                  cellDate.setHours(0, 0, 0, 0);
                  const passado = cellDate < hoje;
                  const domingo = cellDate.getDay() === 0;
                  const desabilitado = passado || domingo || !cell.atual;
                  const key = toDateKey(cell.ano, cell.mes, cell.dia);
                  const disp = cell.atual && !desabilitado ? getDisponibilidade(key, cellDate.getDay()) : null;
                  const selecionado = selecao.data ? cellDate.getTime() === selecao.data.getTime() : false;

                  return (
                    <button
                      key={i}
                      disabled={desabilitado}
                      onClick={() => selecionarData(cell.dia, cell.mes, cell.ano)}
                      className={`relative flex flex-col items-center justify-center rounded py-2 text-sm transition
                        ${!cell.atual ? "text-gray-200" : ""}
                        ${desabilitado && cell.atual ? "text-gray-300 cursor-not-allowed" : ""}
                        ${!desabilitado && cell.atual ? "hover:bg-amber-50 cursor-pointer" : ""}
                        ${selecionado ? "bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]" : ""}
                      `}
                    >
                      <span className={selecionado ? "text-white font-bold" : ""}>{cell.dia}</span>
                      {disp && !selecionado && (
                        <span className={`mt-0.5 h-1 w-5 rounded-full ${
                          disp === "livre" ? "bg-green-400" :
                          disp === "parcial" ? "bg-yellow-400" : "bg-red-300"
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 rounded-full bg-green-400" /> Disponível</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 rounded-full bg-yellow-400" /> Poucos horários</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 rounded-full bg-red-300" /> Lotado</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="border border-gray-200 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Serviço</p>
                <p className="font-semibold text-[#1a1a1a]">{selecao.servico}</p>
                {selecao.preco && <p className="text-[#b8944a] text-sm font-medium mt-0.5">R$ {selecao.preco}</p>}
                <button onClick={() => setStep("servico")} className="text-xs text-gray-400 hover:text-[#b8944a] mt-2 transition">Trocar serviço</button>
              </div>

              {selecao.data && (
                <div className="border border-gray-200 p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
                    Horários para <span className="text-[#b8944a] normal-case font-medium">{dataFormatada}</span>
                  </p>
                  {slotsDisponiveis.length === 0 ? (
                    <p className="text-sm text-gray-400">Sem horários disponíveis. Escolha outra data.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {slotsDisponiveis.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelecao((s) => ({ ...s, horario: slot }))}
                          className={`py-2 text-sm rounded transition border ${
                            selecao.horario === slot
                              ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                              : "border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selecao.data && selecao.horario && (
                <Button onClick={() => setStep("dados")}>Continuar →</Button>
              )}
              {!selecao.data && (
                <p className="text-sm text-gray-400 text-center">Clique em uma data para ver os horários disponíveis</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── STEP: DADOS PESSOAIS ───────────────────────────────────────────────────
  if (step === "dados") {
    return (
      <section className="min-h-screen pt-28 pb-24 bg-white">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-[#b8944a] text-sm font-medium tracking-widest uppercase">Passo 3 de 3</span>
            <h1 className="text-3xl font-bold text-[#1a1a1a] mt-2">Seus dados</h1>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-5 mb-6 flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Serviço</span>
              <span className="font-medium text-[#1a1a1a]">{selecao.servico}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Data</span>
              <span className="font-medium text-[#1a1a1a]">{dataFormatada}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Horário</span>
              <span className="font-medium text-[#1a1a1a]">{selecao.horario}</span>
            </div>
            {selecao.preco && (
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                <span className="text-gray-500">Valor original</span>
                <span className={`font-semibold ${cupomAplicado ? "line-through text-gray-400" : "text-[#b8944a]"}`}>
                  R$ {selecao.preco}
                </span>
              </div>
            )}
            {cupomAplicado && (
              <>
                <div className="flex justify-between text-green-700">
                  <span>Cupom <span className="font-mono font-bold">{cupomAplicado.codigo}</span></span>
                  <span>- R$ {cupomAplicado.desconto.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                  <span className="text-gray-500 font-medium">Total</span>
                  <span className="font-bold text-[#b8944a] text-base">R$ {precoFinal.toFixed(2).replace(".", ",")}</span>
                </div>
              </>
            )}
          </div>

          {/* campo de cupom */}
          <div className="flex flex-col gap-2 mb-2">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cupom de desconto</label>
            <div className="flex gap-2">
              <input
                value={codigoCupom}
                onChange={(e) => { setCodigoCupom(e.target.value.toUpperCase()); setErroCupom(""); setCupomAplicado(null); }}
                placeholder="ex: ORTEGA10"
                disabled={!!cupomAplicado}
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#b8944a] disabled:bg-gray-50"
              />
              {cupomAplicado ? (
                <button
                  onClick={() => { setCupomAplicado(null); setCodigoCupom(""); }}
                  className="px-3 py-2 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50 transition"
                >
                  Remover
                </button>
              ) : (
                <button
                  onClick={aplicarCupom}
                  disabled={!codigoCupom.trim() || validandoCupom}
                  className="px-4 py-2 text-sm bg-[#1a1a1a] text-white rounded hover:bg-[#2d2d2d] transition disabled:opacity-40"
                >
                  {validandoCupom ? "..." : "Aplicar"}
                </button>
              )}
            </div>
            {erroCupom && <p className="text-xs text-red-500">{erroCupom}</p>}
            {cupomAplicado && (
              <p className="text-xs text-green-700 font-medium">
                ✓ Cupom aplicado! Desconto de {cupomAplicado.tipo === "percentual" ? `${cupomAplicado.valor}%` : `R$ ${cupomAplicado.valor}`}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Input label="Nome completo" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} error={erros.nome} />
            <Input label="Telefone / WhatsApp" placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} error={erros.telefone} />
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep("calendario")} className="flex-1 py-3 border border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition">
                ← Voltar
              </button>
              <Button onClick={confirmarAgendamento} disabled={salvando} className="flex-1">
                {salvando ? "Enviando..." : "Confirmar agendamento"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── STEP: CONFIRMADO + STATUS ──────────────────────────────────────────────
  const statusConfig = STATUS_CONFIG[statusAtual as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pendente;

  return (
    <section className="min-h-screen pt-28 pb-24 bg-white">
      <div className="max-w-xl mx-auto px-6 flex flex-col gap-5">
        {/* card de status — atualiza em tempo real */}
        <div className={`border rounded-lg p-5 flex items-start gap-4 ${statusConfig.cor}`}>
          <span className="text-2xl">{statusConfig.icone}</span>
          <div>
            <p className="font-semibold">{statusConfig.label}</p>
            <p className="text-sm mt-0.5 opacity-80">{statusConfig.desc}</p>
            {statusAtual === "pendente" && (
              <p className="text-xs mt-2 opacity-60">Esta página atualiza automaticamente.</p>
            )}
          </div>
        </div>

        {/* resumo do agendamento */}
        <div className="bg-[#1a1a1a] p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white">Resumo do agendamento</h2>
          <div className="text-sm text-gray-400 flex flex-col gap-1">
            <p>Nome: <strong className="text-white">{selecao.nome}</strong></p>
          </div>
          <div className="bg-[#2d2d2d] p-4 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Serviço</span>
              <span className="text-[#b8944a] font-medium">{selecao.servico}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Data</span>
              <span className="text-white">{dataFormatada}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Horário</span>
              <span className="text-white">{selecao.horario}</span>
            </div>
            {selecao.preco && (
              <div className="flex justify-between border-t border-[#3d3d3d] pt-2 mt-1">
                <span className="text-gray-400">Valor</span>
                <span className="text-[#b8944a] font-semibold">R$ {selecao.preco}</span>
              </div>
            )}
          </div>

          {statusAtual === "confirmado" && (
            <a
              href={`https://wa.me/5511999999999?text=Olá! Quero confirmar meu agendamento:%0A*${selecao.servico}*%0AData: ${dataFormatada}%0AHorário: ${selecao.horario}`}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center px-6 py-3 bg-[#b8944a] text-white text-sm font-medium hover:bg-[#a07d3a] transition"
            >
              Falar pelo WhatsApp
            </a>
          )}
        </div>

        <button
          onClick={() => {
            setStep("servico");
            setSelecao({ servico: "", preco: "", data: null, horario: "", nome: "", telefone: "" });
            setNome("");
            setTelefone("");
            setAgendamentoId(null);
            setStatusAtual("pendente");
          }}
          className="text-sm text-gray-400 hover:text-gray-700 transition text-center"
        >
          Fazer outro agendamento
        </button>
      </div>
    </section>
  );
}
