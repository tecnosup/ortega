"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useScrollLock } from "@/components/ui/useScrollLock";
import {
  IconCheck, IconChevronLeft, IconChevronRight, IconChevronDown, IconTag, IconCalendarPlus,
  IconBrandGoogle, IconBrandWindows, IconBrandApple, IconReceipt, IconX,
} from "@tabler/icons-react";
import { baixarICS, linkGoogleAgenda, linkOutlook, type EventoAgenda } from "@/lib/ics";
import type { Item } from "@/lib/admin-items";
import type { CategoriaServico } from "@/lib/admin-categorias-servicos";
import { type Agendamento, resolverDuracaoMin, parsePriceNum } from "@/lib/agendamentos-types";
import type { Barbeiro } from "@/lib/barbeiros-types";
import { toDateKey } from "@/lib/date-utils";
import { gerarSlotsDia, calcularSlotsLivres, mesclarGrade, GRADE_DEFAULT, PASSO_DEFAULT, CARENCIA_DEFAULT, type GradeConfig } from "@/lib/grade";

const STORAGE_KEY = "ortega:agendamento:v1";
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

// ── telefone ──────────────────────────────────────────────────────────────
// A API (route.ts) sanitiza para só dígitos e exige >= 10 (DDD + número).
// Aqui aplicamos a MESMA régua no front para o cliente não passar da validação
// local e tomar erro só na API. Máscara BR: (11) 99999-9999 / (11) 9999-9999.
function soDigitosTelefone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11);
}
function formatarTelefone(v: string) {
  const d = soDigitosTelefone(v);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function telefoneValido(v: string) {
  return soDigitosTelefone(v).length >= 10;
}

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

// Botão voltar padronizado no topo de cada step (mesmo lugar sempre).
// Fica alinhado à esquerda, sobre o StepIndicator centralizado.
function VoltarTopo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute left-0 top-0 flex items-center gap-1 text-sm text-gray-500 hover:text-[#b8944a] transition active:scale-95 py-1 pr-2"
      aria-label="Voltar"
    >
      <IconChevronLeft size={18} /> <span className="hidden sm:inline">Voltar</span>
    </button>
  );
}

// Skeletons de carregamento (reduzem a sensação de espera vs. texto "Carregando...")
function SkeletonServicos() {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-[#2d2d2d] bg-[#111] p-4 sm:p-5 rounded-xl flex items-start gap-3">
          <div className="skeleton w-5 h-5 rounded-md shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-3 w-full rounded" />
          </div>
          <div className="skeleton h-4 w-12 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}
function SkeletonSlots() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-10 rounded-lg" />
      ))}
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function AgendamentoPage() {
  const router = useRouter();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [step, setStep] = useState<Step>("servico");
  const [servicos, setServicos] = useState<Item[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  // filtro de categoria no step 1 (""=todas). Evita rolar a lista inteira.
  const [catFiltro, setCatFiltro] = useState<string>("");
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  // vazio = não configurado. Só mostramos o botão de WhatsApp se o admin
  // configurou um número real (evita mandar o cliente pro número fantasma).
  const [whatsappNumber, setWhatsappNumber] = useState("");
  // endereço da barbearia — usado como LOCAL no evento de calendário (.ics)
  const [enderecoBarbearia, setEnderecoBarbearia] = useState("");
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
  // Direção da troca de mês (1 = avançou, -1 = voltou) pra a animação deslizar pro
  // lado certo. Helper centraliza a troca + a direção.
  const [dirMes, setDirMes] = useState(0);
  const irParaMes = useCallback((novo: Date) => {
    setMesAtual((atual) => {
      const antesMs = atual.getFullYear() * 12 + atual.getMonth();
      const novoMs = novo.getFullYear() * 12 + novo.getMonth();
      if (novoMs !== antesMs) setDirMes(novoMs > antesMs ? 1 : -1);
      return novo;
    });
  }, []);
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

  // ref do bloco de horários — alvo do scroll ao escolher o dia (com scroll-mt
  // grande pra deixar o fim do calendário visível acima). O scroll é disparado
  // SÓ depois que os slots carregam (via efeito abaixo), senão a medição do
  // scrollIntoView usa a altura do skeleton e para no lugar errado.
  const horariosRef = useRef<HTMLDivElement>(null);
  const rolarAoAbrirDia = useRef(false);

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
      fetch("/api/publico/categorias-servicos").then((r) => r.json()).catch(() => ({ categorias: [] })),
    ]).then(([dServicos, dBarbeiros, dSettings, dGrade, dCategorias]) => {
      setServicos(dServicos.items ?? []);
      setCategorias(dCategorias.categorias ?? []);
      setBarbeiros(dBarbeiros.barbeiros ?? []);
      if (dSettings.whatsappNumber) setWhatsappNumber(dSettings.whatsappNumber);
      if (dSettings.enderecoTexto) setEnderecoBarbearia(dSettings.enderecoTexto);
      if (dGrade.grade) setGrade(mesclarGrade(dGrade.grade));
      if (dGrade.passoMin) setPassoMin(dGrade.passoMin);
      if (dGrade.carenciaMin !== undefined) setCarenciaMin(dGrade.carenciaMin);
      setCarregandoDados(false);
    });
  }, []);

  // ── persistência do progresso (sessionStorage) ────────────────────────────
  // Recarregar a página no meio (comum no mobile) não deve zerar o fluxo.
  // Guardamos só o necessário; o Date vira ISO e é reidratado no load. Não
  // persistimos no step "confirmado" (já foi enviado) nem restauramos nele.
  // Portal só depois do mount (evita mismatch de SSR): a barra fixa de resumo é
  // renderizada no body pra escapar do transform/will-change da section animada
  // (.step-anim), que quebrava o position:fixed e "soltava" a barra do rodapé.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Painel "Ver minha comanda" no passo de dados (resumo do agendamento).
  const [verComanda, setVerComanda] = useState(false);
  // Trava o scroll do fundo enquanto o painel está expandido (mesmo do Modal do admin).
  useScrollLock(verComanda);

  const [restaurado, setRestaurado] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.step && p.step !== "confirmado") {
          if (p.selecao) {
            // Se restaurar já no passo do calendário, NÃO traz o dia pré-selecionado
            // (quebraria o fluxo escolher-dia → rolar → horário). Nos passos seguintes
            // a data é mantida, pois lá já foi de fato escolhida.
            const noCalendario = p.step === "calendario";
            setSelecao({
              ...p.selecao,
              data: !noCalendario && p.selecao.data ? new Date(p.selecao.data) : null,
              horario: noCalendario ? "" : p.selecao.horario,
            });
          }
          if (Array.isArray(p.servicosSel)) setServicosSel(p.servicosSel);
          if (typeof p.nome === "string") setNome(p.nome);
          if (typeof p.telefone === "string") setTelefone(p.telefone);
          if (p.mesAtual) setMesAtual(new Date(p.mesAtual));
          setStep(p.step);
        }
      }
    } catch { /* storage indisponível/corrompido → começa do zero */ }
    setRestaurado(true);
  }, []);

  useEffect(() => {
    if (!restaurado) return; // não sobrescreve antes de restaurar
    if (step === "confirmado") { sessionStorage.removeItem(STORAGE_KEY); return; }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        step, selecao: { ...selecao, data: selecao.data ? selecao.data.toISOString() : null },
        servicosSel, nome, telefone, mesAtual: mesAtual.toISOString(),
      }));
    } catch { /* quota/privado → ignora, fluxo segue em memória */ }
  }, [restaurado, step, selecao, servicosSel, nome, telefone, mesAtual]);

  // ── ao AVANÇAR de step, leva o cliente ao topo do novo conteúdo ───────────
  // Sem isso a página fica na posição de scroll anterior (cliente cai no footer).
  // Só dispara em troca de step após o mount — não no carregamento inicial, e
  // não no calendário (lá o scroll é para a seção de horários, tratado à parte).
  const stepMontou = useRef(false);
  useEffect(() => {
    if (!stepMontou.current) { stepMontou.current = true; return; }
    // usa requestAnimationFrame p/ rolar só após o novo step pintar
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [step]);

  // busca slots ocupados do barbeiro escolhido quando muda de data/barbeiro.
  // A API /api/slots já expande a duração de cada agendamento do barbeiro.
  const buscarSlots = useCallback(async (dateKey: string, barbeiroId: string | null) => {
    if (!barbeiroId) return; // barbeiro é obrigatório — sem ele não há o que buscar
    const cacheKey = `${dateKey}__${barbeiroId}`;
    if (slotsOcupados[cacheKey] !== undefined) return;
    setCarregandoSlots(true);
    try {
      const res = await fetch(`/api/slots?data=${dateKey}&barbeiroId=${encodeURIComponent(barbeiroId)}`);
      const { bloqueados } = await res.json();
      setSlotsOcupados((prev) => ({ ...prev, [cacheKey]: bloqueados ?? [] }));
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

  // Rola até os horários assim que os slots do dia escolhido terminam de carregar.
  // Roda só quando a flag foi marcada em selecionarData (não em restauração/re-render).
  useEffect(() => {
    if (carregandoSlots || !rolarAoAbrirDia.current) return;
    rolarAoAbrirDia.current = false;
    // rAF garante que o layout com os slots reais já pintou antes de medir/rolar
    requestAnimationFrame(() => {
      horariosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [carregandoSlots, selecao.data]);

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

  // Próximo dia ATENDIDO a partir do dia seguinte ao 'base' (varre até 60 dias).
  // Usa só a grade (dia ativo com slots) — não promete horário específico (isso
  // exigiria fetch por dia), mas guia o cliente para um dia que ao menos abre.
  function proximaDataAtendida(base: Date): Date | null {
    for (let i = 1; i <= 60; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const dia = grade[d.getDay()];
      if (dia?.ativo && gerarSlotsDia(dia, passoMin).length > 0) return d;
    }
    return null;
  }

  function selecionarData(dia: number, mes: number, ano: number) {
    const d = new Date(ano, mes, dia); // new Date normaliza mes -1/+1 (vira mês/ano certo)
    if (d < hoje || !grade[d.getDay()]?.ativo) return;
    // Clicou num dia de outro mês (célula "vazante" do calendário)? Troca o mês exibido
    // pra o mês do dia escolhido, assim o calendário acompanha a seleção (com animação).
    if (d.getMonth() !== mesAtual.getMonth() || d.getFullYear() !== mesAtual.getFullYear()) {
      irParaMes(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    setSelecao((s) => ({ ...s, data: d, horario: "" }));
    // Marca que deve rolar até os horários. O scroll em si acontece no efeito abaixo,
    // quando os slots terminam de carregar (assim a medição usa a altura real, não a
    // do skeleton — que fazia o scroll parar no lugar errado).
    rolarAoAbrirDia.current = true;
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
    if (!telefoneValido(telefone)) e.telefone = "Informe DDD + número (ex: (11) 99999-9999)";
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
      // invalida o cache do slot que acabou de ser ocupado (barbeiro escolhido)
      setSlotsOcupados((prev) => {
        const prev2 = { ...prev };
        if (selecao.barbeiroId) delete prev2[`${dataKey}__${selecao.barbeiroId}`];
        return prev2;
      });
      setStep("confirmado");
    } catch (err) {
      setErros({ geral: err instanceof Error ? err.message : String(err) });
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

  // categorias que realmente têm serviço publicado (não mostra chip vazio).
  // "sem categoria" vira um grupo próprio no fim, só se houver itens soltos.
  const catsComServico = categorias.filter((c) => servicos.some((s) => s.categoriaId === c.id));
  const temSemCategoria = servicos.some((s) => !s.categoriaId || !categorias.some((c) => c.id === s.categoriaId));
  const mostrarFiltros = catsComServico.length > 1; // só vale filtrar com 2+ categorias
  const servicosVisiveis = catFiltro === ""
    ? servicos
    : catFiltro === "__sem__"
    ? servicos.filter((s) => !s.categoriaId || !categorias.some((c) => c.id === s.categoriaId))
    : servicos.filter((s) => s.categoriaId === catFiltro);

  // ── STEP: SERVIÇO ─────────────────────────────────────────────────────────
  if (step === "servico") {
    return (
      <section key={step} className="min-h-screen-safe pt-20 pb-10 bg-[#0A0A0A] step-anim">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative text-center mb-8">
            <VoltarTopo onClick={() => router.push("/")} />
            <StepIndicator atual={1} />
            <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-3 block">Passo 1 de 4</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5E6C8] mt-2">Escolha o serviço</h1>
          </div>
          <p className="text-center text-gray-500 text-xs mb-4 -mt-4">Você pode escolher mais de um serviço.</p>
          {carregandoDados ? (
            <SkeletonServicos />
          ) : servicos.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-10">Nenhum serviço disponível no momento.</p>
          ) : (
            <>
              {/* filtro por categoria — centralizado quando cabe; no mobile rola
                  na horizontal se houver muitas categorias (flex-nowrap + overflow) */}
              {mostrarFiltros && (
                <div className="flex gap-2 justify-start sm:justify-center flex-nowrap sm:flex-wrap overflow-x-auto pb-3 mb-1 nice-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
                  <button
                    onClick={() => setCatFiltro("")}
                    className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition ${
                      catFiltro === "" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a] hover:text-[#b8944a]"
                    }`}
                  >
                    Todos
                  </button>
                  {catsComServico.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCatFiltro(c.id)}
                      className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition ${
                        catFiltro === c.id ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a] hover:text-[#b8944a]"
                      }`}
                    >
                      {c.nome}
                    </button>
                  ))}
                  {temSemCategoria && (
                    <button
                      onClick={() => setCatFiltro("__sem__")}
                      className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition ${
                        catFiltro === "__sem__" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a]" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a] hover:text-[#b8944a]"
                      }`}
                    >
                      Outros
                    </button>
                  )}
                </div>
              )}
              {/* key = categoria: re-monta a lista ao trocar o filtro, disparando a
                  animação de entrada (cascata) dos serviços da nova categoria. */}
              <div key={catFiltro || "todos"} className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 pb-28">
                {servicosVisiveis.map((s, idx) => {
                  const marcado = servicosSel.some((x) => x.id === s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleServico(s)}
                      style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                      className={`servico-anim text-left border p-4 sm:p-5 rounded-xl active:scale-[0.98] transition-all duration-200 group ${
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

              {/* Espaçador: reserva a altura da barra fixa (que vive no portal, fora
                  desta section) pra o último serviço não ficar escondido atrás dela. */}
              {servicosSel.length > 0 && <div aria-hidden className="h-24" />}

              {/* barra fixa de resumo + continuar — via portal no body pra escapar do
                  transform/will-change da section (.step-anim), que quebrava o fixed */}
              {mounted && servicosSel.length > 0 && createPortal(
                <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#b8944a]/30 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 barra-continuar">
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
                      className="shrink-0 px-7 py-3.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded-xl hover:bg-[#c9a84c] transition active:scale-[0.98] shadow-lg shadow-[#b8944a]/30"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>,
                document.body
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
      <section key={step} className="min-h-screen-safe pt-20 pb-10 bg-[#0A0A0A] step-anim">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="relative text-center mb-8">
            <VoltarTopo onClick={() => setStep("servico")} />
            <StepIndicator atual={2} />
            <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-3 block">Passo 2 de 4</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5E6C8] mt-2">Escolha o barbeiro</h1>
          </div>

          {/* contexto do que já foi escolhido (não some ao trocar de step) */}
          <div className="flex items-center justify-between bg-[#111] border border-[#2d2d2d] rounded-xl px-4 py-3 mb-5">
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-xs text-gray-600 uppercase tracking-wider">Serviço</p>
              <p className="font-semibold text-[#F5E6C8] text-sm truncate">{selecao.servico}
                {selecao.preco && <span className="text-[#b8944a] ml-2">R$ {selecao.preco}</span>}
              </p>
              {selecao.duracaoMin > 0 && <p className="text-xs text-gray-500">{selecao.duracaoMin} min</p>}
            </div>
            <button onClick={() => setStep("servico")} className="text-xs text-gray-600 hover:text-[#b8944a] transition px-2 py-1 shrink-0">
              Trocar
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {barbeiros.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-10">Nenhum barbeiro disponível no momento.</p>
            )}
            {barbeiros.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  // Ao avançar pro calendário, zera data/horário: o dia NÃO pode vir
                  // pré-selecionado (quebraria o fluxo de escolher o dia → rolar → horário).
                  setSelecao((s) => ({ ...s, barbeiroId: b.id, barbeiroNome: b.apelido ?? b.nome, data: null, horario: "" }));
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
        </div>
      </section>
    );
  }

  // ── STEP: CALENDÁRIO ──────────────────────────────────────────────────────
  if (step === "calendario") {
    return (
      <section key={step} className="pt-20 pb-10 bg-[#0A0A0A] step-anim">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative text-center mb-6">
            <VoltarTopo onClick={() => setStep("barbeiro")} />
            <StepIndicator atual={3} />
            <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-3 block">Passo 3 de 4</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5E6C8] mt-2">Data e horário</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 md:gap-6">
            {/* calendário */}
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => irParaMes(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-[#b8944a] hover:bg-[#b8944a]/10 rounded-lg transition"
                >
                  <IconChevronLeft size={20} />
                </button>
                <h2 className="text-base font-bold text-[#F5E6C8]">
                  {MESES[mesAtual.getMonth()]} <span className="text-gray-500 font-normal">{mesAtual.getFullYear()}</span>
                </h2>
                <button
                  onClick={() => irParaMes(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
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

              {/* key força re-render ao trocar de mês → dispara a animação de slide.
                  A direção (dirMes) escolhe se desliza da esquerda ou da direita. */}
              <div
                key={`${mesAtual.getFullYear()}-${mesAtual.getMonth()}`}
                className={`grid grid-cols-7 gap-0.5 sm:gap-1 ${dirMes >= 0 ? "mes-anim-next" : "mes-anim-prev"}`}
              >
                {diasCalendario.map((cell, i) => {
                  const cellDate = new Date(cell.ano, cell.mes, cell.dia);
                  cellDate.setHours(0, 0, 0, 0);
                  const passado = cellDate < hoje;
                  const fechado = !grade[cellDate.getDay()]?.ativo;
                  // Dias de outro mês (cell.atual === false) TAMBÉM são clicáveis: ao
                  // clicar, o calendário troca de mês. Só passado/fechado desabilita.
                  const desabilitado = passado || fechado;
                  const key = toDateKey(cell.ano, cell.mes, cell.dia);
                  const disp = !desabilitado ? getDisponibilidade(key, cellDate.getDay()) : null;
                  const selecionado = selecao.data ? cellDate.getTime() === selecao.data.getTime() : false;

                  return (
                    <button
                      key={i}
                      disabled={desabilitado}
                      onClick={() => selecionarData(cell.dia, cell.mes, cell.ano)}
                      className={`relative flex flex-col items-center justify-center rounded-lg h-10 sm:h-11 text-sm transition-all duration-150 active:scale-95
                        ${desabilitado ? "text-gray-700 cursor-not-allowed" : "hover:bg-[#b8944a]/10 cursor-pointer"}
                        ${!desabilitado && cell.atual ? "text-[#F5E6C8]" : ""}
                        ${!desabilitado && !cell.atual ? "text-gray-500" : ""}
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

            {/* horários — scroll-mt define quanto do calendário fica visível acima ao
                rolar até aqui. Maior = rola menos = mais calendário à mostra (o ponto
                ideal: últimas linhas do mês + legenda acima da grade de horários). */}
            <div ref={horariosRef} className="flex flex-col gap-3 scroll-mt-[320px]">
              {selecao.data ? (
                <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">
                    <span className="text-[#b8944a] normal-case font-medium capitalize">{dataFormatada}</span>
                  </p>
                  {carregandoSlots ? (
                    <SkeletonSlots />
                  ) : slotsDisponiveis.length === 0 ? (
                    (() => {
                      const prox = selecao.data ? proximaDataAtendida(selecao.data) : null;
                      return (
                        <div className="py-4 text-center flex flex-col items-center gap-3">
                          <p className="text-sm text-gray-500">Sem horários disponíveis neste dia.</p>
                          {prox && (
                            <button
                              onClick={() => {
                                // selecionarData já troca o mês (com animação) quando difere
                                selecionarData(prox.getDate(), prox.getMonth(), prox.getFullYear());
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#b8944a] border border-[#b8944a]/40 rounded-lg px-3 py-2 hover:bg-[#b8944a]/10 transition active:scale-95"
                            >
                              <IconChevronRight size={13} /> Ir para {prox.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                            </button>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    // scroll interno: com passo pequeno (ex: 5 min) a lista fica enorme;
                    // limita a altura e rola dentro da div em vez de esticar a página no mobile.
                    // Altura relativa à viewport aproveita melhor a tela (menos vão morto).
                    <div className="max-h-[46vh] sm:max-h-[360px] overflow-y-auto nice-scroll -mr-1 pr-1">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 gap-2">
                        {slotsDisponiveis.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelecao((s) => ({ ...s, horario: slot }))}
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
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-600">Selecione uma data para ver os horários</p>
                </div>
              )}

              {/* barra fixa de resumo + continuar — via portal no body (mesmo padrão do
                  step de serviço) pra escapar do transform/will-change da .step-anim */}
              {mounted && selecao.data && selecao.horario && createPortal(
                <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#b8944a]/30 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 barra-continuar">
                  <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <p className="text-sm font-semibold text-[#F5E6C8] truncate">
                        {selecao.servico}
                        {selecao.preco && <span className="text-[#b8944a] font-bold ml-1.5">R$ {selecao.preco}</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate capitalize">
                        {selecao.data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                        <span className="text-[#b8944a] font-medium"> · {selecao.horario}</span>
                        {selecao.barbeiroNome && <span className="text-gray-500 normal-case"> · {selecao.barbeiroNome}</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => setStep("dados")}
                      className="shrink-0 px-7 py-3.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded-xl hover:bg-[#c9a84c] transition active:scale-[0.98] shadow-lg shadow-[#b8944a]/30"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── STEP: DADOS PESSOAIS ──────────────────────────────────────────────────
  if (step === "dados") {
    // Resumo do agendamento — vive só dentro do modal "Ver minha comanda" (abaixo).
    const resumoComanda = (
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-gray-500 shrink-0">Serviço</span>
          <span className="font-medium text-[#F5E6C8] text-right">{selecao.servico}</span>
        </div>
        {selecao.barbeiroNome && (
          <div className="flex justify-between gap-3">
            <span className="text-gray-500 shrink-0">Barbeiro</span>
            <span className="font-medium text-[#F5E6C8] text-right">{selecao.barbeiroNome}</span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-gray-500 shrink-0">Data</span>
          <span className="font-medium text-[#F5E6C8] capitalize text-right">{dataFormatada}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-500 shrink-0">Horário</span>
          <span className="font-medium text-[#F5E6C8] text-right">{selecao.horario}</span>
        </div>
        {selecao.preco && (
          <div className="flex justify-between gap-3 border-t border-[#2d2d2d] pt-2 mt-1">
            <span className="text-gray-500 shrink-0">Valor</span>
            <span className={`font-semibold text-right ${cupomAplicado ? "line-through text-gray-600" : "text-[#b8944a]"}`}>
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
    );

    return (
      // sem min-h-screen: o conteúdo é curto (form + cupom) e o min-h criava um vão
      // vazio grande até o rodapé. A barra fixa (portal) ancora o rodapé.
      <section key={step} className="pt-20 pb-10 bg-[#0A0A0A] step-anim">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="relative text-center mb-6">
            <VoltarTopo onClick={() => setStep("calendario")} />
            <StepIndicator atual={4} />
            <span className="text-[#b8944a] text-xs font-medium tracking-widest uppercase mt-3 block">Passo 4 de 4</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5E6C8] mt-2">Seus dados</h1>
          </div>


          {/* formulário: nome + telefone primeiro (dados essenciais), cupom por último */}
          <div className="flex flex-col gap-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-400">Nome completo</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className={`${inp} ${erros.nome ? "border-red-500" : ""}`} />
              {erros.nome && <span className="text-xs text-red-400">{erros.nome}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-400">Telefone / WhatsApp</label>
              <input value={telefone} onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); if (erros.telefone) setErros((x) => ({ ...x, telefone: undefined })); }} placeholder="(11) 99999-9999" inputMode="tel" maxLength={16} className={`${inp} ${erros.telefone ? "border-red-500" : ""}`} />
              {erros.telefone && <span className="text-xs text-red-400">{erros.telefone}</span>}
            </div>
          </div>

          {/* cupom (opcional) — por último */}
          <div className="flex flex-col gap-2">
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

          {erros.geral && <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400 text-center mt-4">{erros.geral}</div>}

          {/* Espaçador: reserva a altura da barra fixa (portal) pra o último campo não
              ficar escondido atrás dela. */}
          <div aria-hidden className="h-20" />

          {/* barra fixa + painel do resumo que EXPANDE de dentro dela ("Ver minha
              comanda" e a barra são um só bloco, ancorado no rodapé). */}
          {mounted && createPortal(
            <>
              {/* backdrop — só quando expandido; clicar fecha */}
              <div
                onClick={() => setVerComanda(false)}
                className={`fixed inset-0 z-40 bg-black/70 transition-opacity duration-300 ${verComanda ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              />
              <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#b8944a]/30 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 barra-continuar">
                <div className="max-w-xl mx-auto flex flex-col gap-2.5">
                  {/* Painel do resumo: cresce/encolhe da própria barra (grid-rows anima
                      height:auto). Fica ACIMA dos botões, dentro do mesmo bloco. */}
                  <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${verComanda ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="rounded-xl border border-[#2d2d2d] bg-[#0f0f0f] p-4 mb-0.5 max-h-[50vh] overflow-y-auto nice-scroll">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-[#F5E6C8] text-sm flex items-center gap-2">
                            <IconReceipt size={15} className="text-[#b8944a]" /> Minha comanda
                          </h3>
                          <button onClick={() => setVerComanda(false)} aria-label="Fechar" className="text-gray-500 hover:text-[#F5E6C8] transition p-1 -mr-1">
                            <IconX size={16} />
                          </button>
                        </div>
                        {resumoComanda}
                      </div>
                    </div>
                  </div>

                  {/* Toggle "Ver minha comanda" (o chevron gira quando expandido) */}
                  <button
                    onClick={() => setVerComanda((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-[#0f0f0f] hover:border-[#b8944a]/50 transition active:scale-[0.99]"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <IconReceipt size={16} className="text-[#b8944a]" /> Ver minha comanda
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-[#b8944a]">
                      R$ {precoFinal.toFixed(2).replace(".", ",")}
                      <IconChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${verComanda ? "rotate-180" : ""}`} />
                    </span>
                  </button>

                  <button onClick={confirmarAgendamento} disabled={salvando} className="w-full py-3.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded-xl hover:bg-[#c9a84c] transition disabled:opacity-60 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#b8944a]/30">
                    {salvando ? (<><span className="btn-spinner" /> Enviando...</>) : "Confirmar agendamento"}
                  </button>
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      </section>
    );
  }

  // ── STEP: CONFIRMADO + STATUS ─────────────────────────────────────────────
  const statusConfig = STATUS_CONFIG[statusAtual as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pendente;

  // evento para "adicionar à agenda" (Google/Outlook/Apple) — montado uma vez.
  const eventoAgenda: EventoAgenda | null = selecao.data ? {
    titulo: `${selecao.servico} — Ortega`,
    descricao: [
      selecao.barbeiroNome ? `Barbeiro: ${selecao.barbeiroNome}` : "",
      selecao.preco ? `Valor: R$ ${selecao.preco}` : "",
    ].filter(Boolean).join("\n") || undefined,
    local: enderecoBarbearia || undefined,
    data: toDateKey(selecao.data),
    horario: selecao.horario,
    duracaoMin: selecao.duracaoMin || undefined,
  } : null;

  return (
    <section key={step} className="min-h-screen-safe pt-20 pb-10 bg-[#0A0A0A] step-anim">
      <div className="max-w-xl mx-auto px-4 sm:px-6 flex flex-col gap-4">
        <div className={`border rounded-lg p-5 flex items-start gap-4 ${statusConfig.cor}`}>
          <span key={statusAtual} className="text-2xl success-pop inline-block">{statusConfig.icone}</span>
          <div>
            <p className="font-semibold">{statusConfig.label}</p>
            <p className="text-sm mt-0.5 opacity-80">{statusConfig.desc}</p>
            {statusAtual === "pendente" && <p className="text-xs mt-2 opacity-60">Pode deixar esta página aberta — ela atualiza sozinha assim que o Ortega confirmar. Você não precisa fazer mais nada.</p>}
          </div>
        </div>

        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#F5E6C8]">Resumo do agendamento</h2>
          <div className="text-sm text-gray-500">
            <p>Nome: <strong className="text-[#F5E6C8]">{selecao.nome}</strong></p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg p-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500 shrink-0">Serviço</span>
              <span className="text-[#b8944a] font-medium text-right">{selecao.servico}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500 shrink-0">Data</span>
              <span className="text-[#F5E6C8] text-right capitalize">{dataFormatada}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500 shrink-0">Horário</span>
              <span className="text-[#F5E6C8] text-right">{selecao.horario}</span>
            </div>
            {selecao.preco && (
              <div className="flex justify-between gap-3 border-t border-[#2d2d2d] pt-2 mt-1">
                <span className="text-gray-500 shrink-0">Valor</span>
                <span className="text-[#b8944a] font-semibold text-right">R$ {selecao.preco}</span>
              </div>
            )}
          </div>

          {/* adicionar à agenda do cliente — Google/Outlook abrem já preenchido;
              Apple/iPhone baixa o .ics. Aparece desde o status pendente: o
              cliente garante o horário na agenda dele com lembrete, sem e-mail. */}
          {eventoAgenda && (
            <div className="flex flex-col items-center gap-3 border-t border-[#2d2d2d] pt-4 mt-1">
              <p className="flex items-center gap-2 text-sm font-medium text-[#F5E6C8]">
                <IconCalendarPlus size={16} className="text-[#b8944a]" />
                Adicionar à minha agenda
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={linkGoogleAgenda(eventoAgenda)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#2d2d2d] text-[#F5E6C8] text-sm font-medium rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition active:scale-[0.98]"
                >
                  <IconBrandGoogle size={16} /> Google
                </a>
                <a
                  href={linkOutlook(eventoAgenda)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#2d2d2d] text-[#F5E6C8] text-sm font-medium rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition active:scale-[0.98]"
                >
                  <IconBrandWindows size={16} /> Outlook
                </a>
                <button
                  type="button"
                  onClick={() => baixarICS(eventoAgenda)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#2d2d2d] text-[#F5E6C8] text-sm font-medium rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition active:scale-[0.98]"
                >
                  <IconBrandApple size={16} /> Apple
                </button>
              </div>
              <p className="text-xs text-gray-600 text-center max-w-xs">
                Salva o horário com lembrete automático. No iPhone, use o botão Apple.
              </p>
            </div>
          )}

          {statusAtual === "confirmado" && whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Quero confirmar meu agendamento:\n*${selecao.servico}*\nData: ${dataFormatada}\nHorário: ${selecao.horario}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="self-center inline-flex items-center px-6 py-3 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded-lg hover:bg-[#c9a84c] transition"
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
