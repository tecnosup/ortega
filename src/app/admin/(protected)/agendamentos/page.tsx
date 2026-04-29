"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, RefreshCw, MessageCircle,
  Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, Lock, Undo2,
  CalendarPlus, Ban, Unlock, LayoutGrid, List, Plus,
} from "lucide-react";
import type { Agendamento, AgendamentoStatus, FechamentoDia } from "@/lib/agendamentos";
import { HORARIO_FUNCIONAMENTO } from "@/lib/demo-data";

// ─── helpers ─────────────────────────────────────────────────────────────────

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatarData(dateKey: string) {
  return new Date(dateKey + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function parsePriceNum(preco: string) {
  return parseFloat(preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
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
  pendente: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmado: "bg-blue-50 text-blue-700 border-blue-200",
  cancelado: "bg-red-50 text-red-500 border-red-200",
  concluido: "bg-green-50 text-green-700 border-green-200",
  nao_compareceu: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABEL: Record<AgendamentoStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
  nao_compareceu: "Não compareceu",
};

const SERVICOS_LISTA = [
  "Corte Clássico",
  "Barba Completa",
  "Combo Corte + Barba",
  "Coloração e Luzes",
  "Sobrancelha",
];

// ─── modal de confirmação ─────────────────────────────────────────────────────

interface ModalProps {
  titulo: string;
  mensagem: React.ReactNode;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function Modal({ titulo, mensagem, confirmLabel, confirmClass, onConfirm, onCancel }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <h3 className="font-bold text-gray-900">{titulo}</h3>
        <div className="text-sm text-gray-500 leading-relaxed">{mensagem}</div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── modal de walk-in (novo agendamento presencial) ──────────────────────────

interface WalkInModalProps {
  horario: string;
  dataSelecionada: string;
  onConfirm: (dados: { nome: string; telefone: string; servico: string; preco: string }) => void;
  onCancel: () => void;
}

function WalkInModal({ horario, dataSelecionada, onConfirm, onCancel }: WalkInModalProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState(SERVICOS_LISTA[0]);
  const [preco, setPreco] = useState("");

  const dataLabel = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "long",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-gray-900">Novo agendamento presencial</h3>
          <p className="text-xs text-gray-400 mt-0.5">{dataLabel} às {horario}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Nome do cliente</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">WhatsApp (opcional)</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="11999999999"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Serviço</label>
            <select
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]"
            >
              {SERVICOS_LISTA.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Preço (R$)</label>
            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="55"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={() => { if (nome.trim()) onConfirm({ nome, telefone, servico, preco }); }}
            disabled={!nome.trim()}
            className="px-4 py-2 text-sm text-white bg-[#b8944a] hover:bg-[#a07d3a] rounded transition disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── modal de reagendamento ───────────────────────────────────────────────────

interface ReagendarModalProps {
  ag: Agendamento;
  dataSelecionada: string;
  slotsLivres: string[];
  onConfirm: (novaData: string, novoHorario: string) => void;
  onCancel: () => void;
}

function ReagendarModal({ ag, dataSelecionada, slotsLivres, onConfirm, onCancel }: ReagendarModalProps) {
  const [novaData, setNovaData] = useState(dataSelecionada);
  const [novoHorario, setNovoHorario] = useState(slotsLivres[0] ?? ag.horario);

  const slotsParaData = novaData === dataSelecionada
    ? slotsLivres
    : gerarSlots(novaData); // simplificado: mostra todos para outras datas

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-gray-900">Reagendar</h3>
          <p className="text-xs text-gray-400 mt-0.5">{ag.nome} · {ag.servico}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Nova data</label>
            <input
              type="date"
              value={novaData}
              onChange={(e) => { setNovaData(e.target.value); setNovoHorario(""); }}
              min={toDateKey(new Date())}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Novo horário</label>
            {slotsParaData.length > 0 ? (
              <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto">
                {slotsParaData.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNovoHorario(s)}
                    className={`text-xs py-1.5 rounded border transition ${
                      novoHorario === s
                        ? "bg-[#b8944a] text-white border-[#b8944a]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#b8944a]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Nenhum slot disponível neste dia.</p>
            )}
          </div>
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
          O cliente receberá uma mensagem no WhatsApp com o novo horário.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={() => { if (novoHorario) onConfirm(novaData, novoHorario); }}
            disabled={!novoHorario}
            className="px-4 py-2 text-sm text-white bg-[#1a1a1a] hover:bg-[#2d2d2d] rounded transition disabled:opacity-40"
          >
            Reagendar e notificar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── tipos de modal geral ─────────────────────────────────────────────────────

type ModalState = {
  tipo: "concluir" | "excluir" | "fechar_caixa" | "bloquear";
  id?: string;
  horario?: string;
} | null;

// ─── componente principal ─────────────────────────────────────────────────────

export default function AgendamentosAdminPage() {
  const hoje = new Date();
  const [dataSelecionada, setDataSelecionada] = useState(toDateKey(hoje));
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
  const [reagendarAg, setReagendarAg] = useState<Agendamento | null>(null);
  const [aba, setAba] = useState<"lista" | "grade">("lista");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [resAgs, resFech, resBloq] = await Promise.all([
      fetch("/api/agendamentos"),
      fetch("/api/fechamento"),
      fetch(`/api/slots?data=${dataSelecionada}`),
    ]);
    const ags: Agendamento[] = await resAgs.json();
    const fechs: FechamentoDia[] = await resFech.json();
    const { bloqueados }: { bloqueados: string[] } = await resBloq.json();
    setAgendamentos(ags);
    setFechamentos(fechs);
    setSlotsBloqueados(bloqueados);
    setCaixaFechado(fechs.some((f) => f.data === dataSelecionada));
    setCarregando(false);
  }, [dataSelecionada]);

  useEffect(() => { carregar(); }, [carregar]);

  function mudarDia(delta: number) {
    const d = new Date(dataSelecionada + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setDataSelecionada(toDateKey(d));
    setEditandoId(null);
  }

  const agsDia = agendamentos
    .filter((a) => a.data === dataSelecionada)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const concluidos = agsDia.filter((a) => a.status === "concluido");
  const totalDia = concluidos.reduce((s, a) => s + parsePriceNum(a.preco), 0);

  const todosSlotsDia = gerarSlots(dataSelecionada);
  const horariosOcupados = new Set(agsDia.map((a) => a.horario));
  const slotsLivresDia = todosSlotsDia.filter(
    (s) => !horariosOcupados.has(s) && !slotsBloqueados.includes(s)
  );

  // ── ações ──────────────────────────────────────────────────────────────────

  async function atualizarStatus(id: string, status: AgendamentoStatus) {
    setProcessando(id);
    const res = await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
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
    await fetch(`/api/agendamentos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servico: servicoFinal, preco: precoFinal }),
    });
    setAgendamentos((prev) =>
      prev.map((a) => a.id === id ? { ...a, servico: servicoFinal, preco: precoFinal } : a)
    );
    setEditandoId(null);
    setProcessando(null);
  }

  async function excluir(id: string) {
    await fetch(`/api/agendamentos/${id}`, { method: "DELETE" });
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
  }

  async function fecharCaixa() {
    setFechandoCaixa(true);
    await fetch("/api/fechamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: dataSelecionada }),
    });
    setCaixaFechado(true);
    setFechandoCaixa(false);
  }

  async function toggleBloquearSlot(horario: string) {
    const jaBloquado = slotsBloqueados.includes(horario);
    await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: dataSelecionada, horario, acao: jaBloquado ? "desbloquear" : "bloquear" }),
    });
    setSlotsBloqueados((prev) =>
      jaBloquado ? prev.filter((s) => s !== horario) : [...prev, horario]
    );
  }

  async function criarWalkIn(dados: { nome: string; telefone: string; servico: string; preco: string }) {
    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: dados.nome,
        telefone: dados.telefone || "00000000000",
        servico: dados.servico,
        preco: dados.preco,
        data: dataSelecionada,
        horario: walkInHorario,
      }),
    });
    const { id } = await res.json();
    // Confirmar direto (é presencial)
    await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmado" }),
    });
    setWalkInHorario(null);
    carregar();
  }

  async function reagendar(novaData: string, novoHorario: string) {
    if (!reagendarAg) return;
    const res = await fetch(`/api/agendamentos/${reagendarAg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: novaData, horario: novoHorario }),
    });
    const data = await res.json();
    setReagendarAg(null);
    carregar();
    if (data.whatsappLink) window.open(data.whatsappLink, "_blank");
  }

  // ── resolução do modal ─────────────────────────────────────────────────────

  function confirmarModal() {
    if (!modal) return;
    if (modal.tipo === "concluir" && modal.id) atualizarStatus(modal.id, "concluido");
    if (modal.tipo === "excluir" && modal.id) excluir(modal.id);
    if (modal.tipo === "fechar_caixa") fecharCaixa();
    if (modal.tipo === "bloquear" && modal.horario) toggleBloquearSlot(modal.horario);
    setModal(null);
  }

  const modalConfig: Record<NonNullable<ModalState>["tipo"], { titulo: string; mensagem: React.ReactNode; confirmLabel: string; confirmClass: string }> = {
    concluir: {
      titulo: "Marcar como concluído?",
      mensagem: "O serviço será incluído no caixa do dia. Você pode reverter clicando em 'Desfazer' enquanto o caixa não for fechado.",
      confirmLabel: "Concluir",
      confirmClass: "bg-green-600 hover:bg-green-700",
    },
    excluir: {
      titulo: "Remover agendamento?",
      mensagem: "Esta ação remove o agendamento da lista. Não afeta o relatório financeiro caso o caixa já tenha sido fechado.",
      confirmLabel: "Remover",
      confirmClass: "bg-red-500 hover:bg-red-600",
    },
    fechar_caixa: {
      titulo: "Fechar o caixa do dia?",
      mensagem: `Serão registrados ${concluidos.length} serviços concluídos, totalizando R$ ${totalDia.toFixed(2).replace(".", ",")}. Após fechar, não é possível alterar o relatório financeiro deste dia.`,
      confirmLabel: "Fechar caixa",
      confirmClass: "bg-[#1a1a1a] hover:bg-[#2d2d2d]",
    },
    bloquear: {
      titulo: modal?.horario && slotsBloqueados.includes(modal.horario) ? "Desbloquear horário?" : "Bloquear horário?",
      mensagem: modal?.horario && slotsBloqueados.includes(modal.horario)
        ? `O horário ${modal.horario} voltará a aparecer como disponível para clientes.`
        : `O horário ${modal?.horario} ficará indisponível para novos agendamentos.`,
      confirmLabel: modal?.horario && slotsBloqueados.includes(modal.horario) ? "Desbloquear" : "Bloquear",
      confirmClass: "bg-[#1a1a1a] hover:bg-[#2d2d2d]",
    },
  };

  const ehHoje = dataSelecionada === toDateKey(hoje);
  const ehFuturo = dataSelecionada > toDateKey(hoje);
  const diaFechado = todosSlotsDia.length === 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* modais */}
      {modal && (
        <Modal
          {...modalConfig[modal.tipo]}
          onConfirm={confirmarModal}
          onCancel={() => setModal(null)}
        />
      )}
      {walkInHorario && (
        <WalkInModal
          horario={walkInHorario}
          dataSelecionada={dataSelecionada}
          onConfirm={criarWalkIn}
          onCancel={() => setWalkInHorario(null)}
        />
      )}
      {reagendarAg && (
        <ReagendarModal
          ag={reagendarAg}
          dataSelecionada={dataSelecionada}
          slotsLivres={slotsLivresDia}
          onConfirm={reagendar}
          onCancel={() => setReagendarAg(null)}
        />
      )}

      {/* cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
        <button onClick={carregar} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition">
          <RefreshCw size={14} className={carregando ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {/* seletor de data */}
      <div className="flex items-center gap-3 mb-6 bg-white border border-gray-200 rounded-lg px-4 py-3 w-fit">
        <button onClick={() => mudarDia(-1)} className="p-1 hover:text-[#b8944a] transition"><ChevronLeft size={18} /></button>
        <div className="text-center min-w-[200px]">
          <p className="font-semibold text-gray-900 capitalize">{formatarData(dataSelecionada)}</p>
          {ehHoje && <span className="text-xs text-[#b8944a]">Hoje</span>}
          {diaFechado && <span className="text-xs text-gray-400">Fechado</span>}
        </div>
        <button onClick={() => mudarDia(1)} className="p-1 hover:text-[#b8944a] transition"><ChevronRight size={18} /></button>
      </div>

      {diaFechado ? (
        <div className="text-sm text-gray-400 py-12 text-center border border-dashed border-gray-200 rounded-lg">
          Barbearia fechada neste dia.
        </div>
      ) : (
        <>
          {/* resumo do dia */}
          {agsDia.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Agendamentos</p>
                <p className="text-2xl font-bold text-gray-900">{agsDia.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{concluidos.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Faturamento do dia</p>
                <p className="text-2xl font-bold text-[#b8944a]">
                  R$ {totalDia.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          )}

          {/* abas */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setAba("lista")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition ${
                aba === "lista" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List size={14} /> Lista
            </button>
            <button
              onClick={() => setAba("grade")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition ${
                aba === "grade" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid size={14} /> Grade de horários
            </button>
          </div>

          {/* ── ABA LISTA ────────────────────────────────────────────────── */}
          {aba === "lista" && (
            <>
              {carregando ? (
                <div className="text-sm text-gray-400 py-12 text-center">Carregando...</div>
              ) : agsDia.length === 0 ? (
                <div className="text-sm text-gray-400 py-12 text-center border border-dashed border-gray-200 rounded-lg">
                  {ehFuturo ? "Nenhum agendamento para este dia ainda." : "Nenhum agendamento neste dia."}
                </div>
              ) : (
                <div className="flex flex-col gap-2 mb-6">
                  {agsDia.map((ag) => {
                    const editando = editandoId === ag.id;
                    const ocupado = processando === ag.id;
                    const ehConcluido = ag.status === "concluido";
                    const finalizado = ehConcluido || ag.status === "nao_compareceu" || ag.status === "cancelado";

                    return (
                      <div key={ag.id} className={`bg-white border rounded-lg p-4 transition ${finalizado && !ehConcluido ? "opacity-60" : ""}`}>
                        <div className="flex items-start gap-3">
                          <div className="text-sm font-bold text-gray-400 w-12 flex-shrink-0 pt-0.5">{ag.horario}</div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-gray-900 text-sm">{ag.nome}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[ag.status]}`}>
                                {STATUS_LABEL[ag.status] ?? ag.status}
                              </span>
                            </div>

                            {editando ? (
                              <div className="mt-2 flex flex-col gap-2">
                                {editLinhas.map((linha, idx) => (
                                  <div key={idx} className="flex gap-2 items-center flex-wrap">
                                    <select
                                      value={linha.servico}
                                      onChange={(e) => setEditLinhas((prev) => prev.map((l, i) => i === idx ? { ...l, servico: e.target.value } : l))}
                                      className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-[#b8944a]"
                                    >
                                      {SERVICOS_LISTA.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                    <input
                                      value={linha.preco}
                                      onChange={(e) => setEditLinhas((prev) => prev.map((l, i) => i === idx ? { ...l, preco: e.target.value } : l))}
                                      placeholder="Preço (R$)"
                                      className="border border-gray-300 rounded px-2 py-1 text-sm w-28 focus:outline-none focus:border-[#b8944a]"
                                    />
                                    {editLinhas.length > 1 && (
                                      <button
                                        onClick={() => setEditLinhas((prev) => prev.filter((_, i) => i !== idx))}
                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                        title="Remover serviço"
                                      >
                                        <X size={13} />
                                      </button>
                                    )}
                                  </div>
                                ))}

                                {/* total calculado */}
                                {editLinhas.length > 1 && (
                                  <p className="text-xs text-[#b8944a] font-medium pl-0.5">
                                    Total: R$ {editLinhas.reduce((s, l) => s + parsePriceNum(l.preco), 0).toFixed(2).replace(".", ",")}
                                  </p>
                                )}

                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => setEditLinhas((prev) => [...prev, { servico: SERVICOS_LISTA[0], preco: "" }])}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded hover:bg-amber-50 transition"
                                  >
                                    <Plus size={11} /> Adicionar serviço
                                  </button>
                                  <button onClick={() => salvarEdicao(ag.id)} disabled={ocupado}
                                    className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs hover:bg-green-100 transition">
                                    <Check size={12} /> Salvar
                                  </button>
                                  <button onClick={() => setEditandoId(null)}
                                    className="flex items-center gap-1 px-2 py-1 border border-gray-200 text-gray-500 rounded text-xs hover:bg-gray-50 transition">
                                    <X size={12} /> Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 flex flex-wrap gap-x-3">
                                <span>✂️ {ag.servico}</span>
                                {ag.preco && <span className="text-[#b8944a] font-medium">R$ {ag.preco}</span>}
                                <a href={`https://wa.me/55${ag.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                                  className="hover:text-green-600 transition">📱 {ag.telefone}</a>
                              </div>
                            )}
                          </div>

                          {/* ações */}
                          {!editando && !caixaFechado && (
                            <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">

                              {/* desfazer concluído */}
                              {ehConcluido && (
                                <button
                                  onClick={() => atualizarStatus(ag.id, "confirmado")}
                                  disabled={ocupado}
                                  title="Desfazer — voltar para confirmado"
                                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 hover:text-gray-800 transition"
                                >
                                  <Undo2 size={13} /> Desfazer
                                </button>
                              )}

                              {/* concluir */}
                              {(ag.status === "confirmado" || ag.status === "pendente") && (
                                <button
                                  onClick={() => setModal({ tipo: "concluir", id: ag.id })}
                                  disabled={ocupado}
                                  title="Marcar como concluído"
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}

                              {/* não compareceu */}
                              {(ag.status === "confirmado" || ag.status === "pendente") && (
                                <button
                                  onClick={() => atualizarStatus(ag.id, "nao_compareceu")}
                                  disabled={ocupado}
                                  title="Não compareceu"
                                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition"
                                >
                                  <Clock size={16} />
                                </button>
                              )}

                              {/* reverter não compareceu */}
                              {ag.status === "nao_compareceu" && (
                                <button
                                  onClick={() => atualizarStatus(ag.id, "confirmado")}
                                  disabled={ocupado}
                                  title="Desfazer — voltar para confirmado"
                                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition"
                                >
                                  <Undo2 size={13} /> Desfazer
                                </button>
                              )}

                              {/* confirmar via WhatsApp (se pendente) */}
                              {ag.status === "pendente" && (
                                <button
                                  onClick={() => atualizarStatus(ag.id, "confirmado")}
                                  disabled={ocupado}
                                  title="Confirmar e notificar"
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition"
                                >
                                  <MessageCircle size={16} />
                                </button>
                              )}

                              {/* reagendar */}
                              {!finalizado && (
                                <button
                                  onClick={() => setReagendarAg(ag)}
                                  title="Reagendar"
                                  className="p-1.5 text-[#b8944a] hover:bg-amber-50 rounded transition"
                                >
                                  <CalendarPlus size={16} />
                                </button>
                              )}

                              {/* editar */}
                              {!finalizado && (
                                <button
                                  onClick={() => {
                                setEditandoId(ag.id);
                                // suporta múltiplos serviços separados por " + "
                                const servicos = ag.servico.split(" + ");
                                const precos = ag.preco.split(" + ");
                                setEditLinhas(servicos.map((s, i) => ({ servico: s.trim(), preco: precos[i]?.trim() ?? "" })));
                              }}
                                  title="Editar serviço/preço"
                                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}

                              {/* excluir */}
                              <button
                                onClick={() => setModal({ tipo: "excluir", id: ag.id })}
                                title="Remover"
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── ABA GRADE ────────────────────────────────────────────────── */}
          {aba === "grade" && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-3">
                Clique em um horário livre para adicionar cliente presencial ou bloqueá-lo. Clique no ícone do cliente agendado para reagendar.
              </p>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {todosSlotsDia.map((slot) => {
                  const agNoSlot = agsDia.find((a) => a.horario === slot);
                  const bloqueado = slotsBloqueados.includes(slot);
                  const livre = !agNoSlot && !bloqueado;

                  return (
                    <div key={slot} className={`flex items-center gap-3 px-4 py-3 ${bloqueado ? "bg-gray-50" : ""}`}>
                      {/* horário */}
                      <span className="text-sm font-bold text-gray-400 w-12 flex-shrink-0">{slot}</span>

                      {/* conteúdo */}
                      <div className="flex-1">
                        {agNoSlot ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{agNoSlot.nome}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[agNoSlot.status]}`}>
                              {STATUS_LABEL[agNoSlot.status] ?? agNoSlot.status}
                            </span>
                            <span className="text-xs text-gray-400">✂️ {agNoSlot.servico}</span>
                            {agNoSlot.preco && <span className="text-xs text-[#b8944a] font-medium">R$ {agNoSlot.preco}</span>}
                          </div>
                        ) : bloqueado ? (
                          <span className="text-sm text-gray-400 flex items-center gap-1.5">
                            <Ban size={13} className="text-red-400" /> Bloqueado pelo admin
                          </span>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">Disponível</span>
                        )}
                      </div>

                      {/* ações do slot */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {agNoSlot && !caixaFechado && (
                          <>
                            {/* reagendar da grade */}
                            {agNoSlot.status !== "cancelado" && agNoSlot.status !== "concluido" && (
                              <button
                                onClick={() => setReagendarAg(agNoSlot)}
                                title="Reagendar"
                                className="p-1.5 text-[#b8944a] hover:bg-amber-50 rounded transition"
                              >
                                <CalendarPlus size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => setModal({ tipo: "excluir", id: agNoSlot.id })}
                              title="Remover"
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}

                        {livre && !caixaFechado && (
                          <>
                            <button
                              onClick={() => setWalkInHorario(slot)}
                              title="Adicionar cliente presencial"
                              className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded hover:bg-amber-50 transition"
                            >
                              <CalendarPlus size={12} /> Agendar
                            </button>
                            <button
                              onClick={() => setModal({ tipo: "bloquear", horario: slot })}
                              title="Bloquear horário"
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition"
                            >
                              <Ban size={14} />
                            </button>
                          </>
                        )}

                        {bloqueado && !caixaFechado && (
                          <button
                            onClick={() => setModal({ tipo: "bloquear", horario: slot })}
                            title="Desbloquear horário"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition"
                          >
                            <Unlock size={12} /> Desbloquear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* fechar caixa */}
          {agsDia.length > 0 && !ehFuturo && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              {caixaFechado ? (
                <div className="flex items-center gap-3 text-green-700">
                  <Lock size={18} />
                  <div>
                    <p className="font-semibold text-sm">Caixa fechado</p>
                    <p className="text-xs text-gray-400">
                      {concluidos.length} serviços · Total R$ {totalDia.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Fechar o caixa do dia</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Valide todos os atendimentos antes. Após fechar, os dados vão para o relatório financeiro.
                    </p>
                  </div>
                  <button
                    onClick={() => setModal({ tipo: "fechar_caixa" })}
                    disabled={fechandoCaixa || concluidos.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#2d2d2d] transition disabled:opacity-40 disabled:cursor-not-allowed rounded"
                  >
                    <Lock size={14} />
                    {fechandoCaixa ? "Fechando..." : "Fechar caixa"}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
