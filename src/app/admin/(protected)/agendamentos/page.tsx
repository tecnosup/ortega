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

function WalkInModal({ horario, dataSelecionada, onConfirm, onCancel }: {
  horario: string; dataSelecionada: string;
  onConfirm: (dados: { nome: string; telefone: string; servico: string; preco: string }) => void;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState(SERVICOS_LISTA[0]);
  const [preco, setPreco] = useState("");
  const dataLabel = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

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
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">Cancelar</button>
          <button onClick={() => { if (nome.trim()) onConfirm({ nome, telefone, servico, preco }); }} disabled={!nome.trim()} className="px-4 py-2 text-sm text-[#0A0A0A] bg-[#b8944a] hover:bg-[#c9a84c] rounded transition disabled:opacity-40">{`Confirmar`}</button>
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
  const hojeKey = toDateKey(new Date());
  const minutosAgora = new Date().getHours() * 60 + new Date().getMinutes();
  const slotsParaData = (novaData === dataSelecionada ? slotsLivres : gerarSlots(novaData)).filter((s) => {
    if (novaData !== hojeKey) return true;
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m > minutosAgora;
  });
  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div><h3 className="font-bold text-[#F5E6C8]">Reagendar</h3><p className="text-xs text-gray-500 mt-0.5">{ag.nome} · {ag.servico}</p></div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1"><label className="text-xs text-gray-400">Nova data</label><input type="date" value={novaData} onChange={(e) => { setNovaData(e.target.value); setNovoHorario(""); }} min={toDateKey(new Date())} className={inp} /></div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Novo horário</label>
            {slotsParaData.length > 0 ? (
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
          <button onClick={() => { if (novoHorario) onConfirm(novaData, novoHorario); }} disabled={!novoHorario} className="px-4 py-2 text-sm text-white bg-[#1a1a1a] hover:bg-[#2d2d2d] border border-[#3d3d3d] rounded transition disabled:opacity-40">Reagendar e notificar</button>
        </div>
      </div>
    </div>
  );
}

type ModalState = { tipo: "concluir" | "excluir" | "fechar_caixa" | "bloquear"; id?: string; horario?: string } | null;

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
  const [notificacaoLink, setNotificacaoLink] = useState<string | null>(null);
  const [aba, setAba] = useState<"lista" | "grade">("lista");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [resAgs, resFech, resBloq] = await Promise.all([
      fetch("/api/agendamentos", { credentials: "include" }),
      fetch("/api/fechamento", { credentials: "include" }),
      fetch(`/api/slots?data=${dataSelecionada}`, { credentials: "include" }),
    ]);
    const ags: Agendamento[] = await resAgs.json();
    const fechs: FechamentoDia[] = await resFech.json();
    const { bloqueados } = await resBloq.json();
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

  const agsDia = agendamentos.filter((a) => a.data === dataSelecionada).sort((a, b) => a.horario.localeCompare(b.horario));
  const concluidos = agsDia.filter((a) => a.status === "concluido");
  const totalDia = concluidos.reduce((s, a) => s + parsePriceNum(a.preco), 0);
  const todosSlotsDia = gerarSlots(dataSelecionada);
  const horariosOcupados = new Set(agsDia.map((a) => a.horario));
  const slotsLivresDia = todosSlotsDia.filter((s) => !horariosOcupados.has(s) && !slotsBloqueados.includes(s));

  async function atualizarStatus(id: string, status: AgendamentoStatus) {
    setProcessando(id);
    const res = await fetch(`/api/agendamentos/${id}`, { credentials: "include",  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
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
    await fetch(`/api/agendamentos/${id}`, { credentials: "include",  method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ servico: servicoFinal, preco: precoFinal }) });
    setAgendamentos((prev) => prev.map((a) => a.id === id ? { ...a, servico: servicoFinal, preco: precoFinal } : a));
    setEditandoId(null);
    setProcessando(null);
  }

  async function excluir(id: string) {
    await fetch(`/api/agendamentos/${id}`, { credentials: "include",  method: "DELETE" });
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
  }

  async function fecharCaixa() {
    setFechandoCaixa(true);
    await fetch("/api/fechamento", { credentials: "include",  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: dataSelecionada }) });
    setCaixaFechado(true);
    setFechandoCaixa(false);
  }

  async function toggleBloquearSlot(horario: string) {
    const jaBloqueado = slotsBloqueados.includes(horario);
    await fetch("/api/slots", { credentials: "include",  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: dataSelecionada, horario, acao: jaBloqueado ? "desbloquear" : "bloquear" }) });
    setSlotsBloqueados((prev) => jaBloqueado ? prev.filter((s) => s !== horario) : [...prev, horario]);
  }

  async function criarWalkIn(dados: { nome: string; telefone: string; servico: string; preco: string }) {
    const res = await fetch("/api/agendamentos", { credentials: "include",  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dados, telefone: dados.telefone || "00000000000", data: dataSelecionada, horario: walkInHorario }) });
    const { id } = await res.json();
    await fetch(`/api/agendamentos/${id}`, { credentials: "include",  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "confirmado" }) });
    setWalkInHorario(null);
    carregar();
  }

  async function reagendar(novaData: string, novoHorario: string) {
    if (!reagendarAg) return;
    const res = await fetch(`/api/agendamentos/${reagendarAg.id}`, { credentials: "include",  method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: novaData, horario: novoHorario }) });
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

  const ehHoje = dataSelecionada === toDateKey(hoje);
  const ehFuturo = dataSelecionada > toDateKey(hoje);
  const diaFechado = todosSlotsDia.length === 0;
  const cardDark = "bg-[#111] border border-[#2d2d2d] rounded-lg";
  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-2 py-1 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

  return (
    <div className="max-w-4xl mx-auto">
      {modal && <Modal {...modalConfig[modal.tipo]} onConfirm={confirmarModal} onCancel={() => setModal(null)} />}
      {walkInHorario && <WalkInModal horario={walkInHorario} dataSelecionada={dataSelecionada} onConfirm={criarWalkIn} onCancel={() => setWalkInHorario(null)} />}
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Agendamentos</h1>
        <button onClick={carregar} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#b8944a] transition">
          <RefreshCw size={14} className={carregando ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {/* seletor de data */}
      <div className={`flex items-center gap-3 mb-6 ${cardDark} px-4 py-3 w-fit`}>
        <button onClick={() => mudarDia(-1)} className="p-1 text-gray-400 hover:text-[#b8944a] transition"><ChevronLeft size={18} /></button>
        <div className="text-center min-w-[200px]">
          <p className="font-semibold text-[#F5E6C8] capitalize">{formatarData(dataSelecionada)}</p>
          {ehHoje && <span className="text-xs text-[#b8944a]">Hoje</span>}
          {diaFechado && <span className="text-xs text-gray-500">Fechado</span>}
        </div>
        <button onClick={() => mudarDia(1)} className="p-1 text-gray-400 hover:text-[#b8944a] transition"><ChevronRight size={18} /></button>
      </div>

      {diaFechado ? (
        <div className="text-sm text-gray-500 py-12 text-center border border-dashed border-[#2d2d2d] rounded-lg">Barbearia fechada neste dia.</div>
      ) : (
        <>
          {agsDia.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Agendamentos", value: agsDia.length, cor: "text-[#F5E6C8]" },
                { label: "Concluídos", value: concluidos.length, cor: "text-green-400" },
                { label: "Faturamento do dia", value: `R$ ${totalDia.toFixed(2).replace(".", ",")}`, cor: "text-[#b8944a]" },
              ].map((k) => (
                <div key={k.label} className={`${cardDark} p-4`}>
                  <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold ${k.cor}`}>{k.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* abas */}
          <div className="flex gap-1 mb-4 bg-[#111] border border-[#2d2d2d] rounded-lg p-1 w-fit">
            {[{ id: "lista", label: "Lista", icon: List }, { id: "grade", label: "Grade de horários", icon: LayoutGrid }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setAba(id as "lista" | "grade")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition ${aba === id ? "bg-[#1a1a1a] text-[#b8944a]" : "text-gray-500 hover:text-gray-300"}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* LISTA */}
          {aba === "lista" && (
            <>
              {carregando ? (
                <div className="text-sm text-gray-500 py-12 text-center">Carregando...</div>
              ) : agsDia.length === 0 ? (
                <div className="text-sm text-gray-500 py-12 text-center border border-dashed border-[#2d2d2d] rounded-lg">
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
                      <div key={ag.id} className={`${cardDark} p-4 transition ${finalizado && !ehConcluido ? "opacity-50" : ""}`}>
                        <div className="flex items-start gap-3">
                          <div className="text-sm font-bold text-gray-500 w-12 flex-shrink-0 pt-0.5">{ag.horario}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-[#F5E6C8] text-sm">{ag.nome}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[ag.status]}`}>{STATUS_LABEL[ag.status]}</span>
                            </div>
                            {editando ? (
                              <div className="mt-2 flex flex-col gap-2">
                                {editLinhas.map((linha, idx) => (
                                  <div key={idx} className="flex gap-2 items-center flex-wrap">
                                    <select value={linha.servico} onChange={(e) => setEditLinhas((prev) => prev.map((l, i) => i === idx ? { ...l, servico: e.target.value } : l))} className={inp}>{SERVICOS_LISTA.map((s) => <option key={s}>{s}</option>)}</select>
                                    <input value={linha.preco} onChange={(e) => setEditLinhas((prev) => prev.map((l, i) => i === idx ? { ...l, preco: e.target.value } : l))} placeholder="Preço (R$)" className={`${inp} w-28`} />
                                    {editLinhas.length > 1 && <button onClick={() => setEditLinhas((prev) => prev.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-300 rounded transition"><X size={13} /></button>}
                                  </div>
                                ))}
                                {editLinhas.length > 1 && <p className="text-xs text-[#b8944a] font-medium">Total: R$ {editLinhas.reduce((s, l) => s + parsePriceNum(l.preco), 0).toFixed(2).replace(".", ",")}</p>}
                                <div className="flex gap-2 flex-wrap">
                                  <button onClick={() => setEditLinhas((prev) => [...prev, { servico: SERVICOS_LISTA[0], preco: "" }])} className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded hover:bg-[#b8944a]/10 transition"><Plus size={11} /> Adicionar serviço</button>
                                  <button onClick={() => salvarEdicao(ag.id)} disabled={ocupado} className="flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 border border-green-700/50 rounded text-xs hover:bg-green-900/50 transition"><Check size={12} /> Salvar</button>
                                  <button onClick={() => setEditandoId(null)} className="flex items-center gap-1 px-2 py-1 border border-[#2d2d2d] text-gray-400 rounded text-xs hover:border-[#b8944a] transition"><X size={12} /> Cancelar</button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 flex flex-wrap gap-x-3">
                                <span>✂️ {ag.servico}</span>
                                {ag.preco && <span className="text-[#b8944a] font-medium">R$ {ag.preco}</span>}
                                {ag.cupom && (
                                  <span className="text-xs px-2 py-0.5 bg-[#b8944a]/10 text-[#b8944a] border border-[#b8944a]/30 rounded-full font-mono">
                                    🏷️ {ag.cupom}{ag.desconto ? ` −R$ ${ag.desconto.toFixed(2).replace(".", ",")}` : ""}
                                  </span>
                                )}
                                <a href={`https://wa.me/55${ag.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition">📱 {ag.telefone}</a>
                              </div>
                            )}
                          </div>
                          {!editando && !caixaFechado && (
                            <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                              {ehConcluido && <button onClick={() => atualizarStatus(ag.id, "confirmado")} disabled={ocupado} title="Desfazer" className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition"><Undo2 size={13} /></button>}
                              {(ag.status === "confirmado" || ag.status === "pendente") && <button onClick={() => setModal({ tipo: "concluir", id: ag.id })} disabled={ocupado} title="Concluir" className="p-1.5 text-green-500 hover:bg-green-900/20 rounded transition"><CheckCircle size={16} /></button>}
                              {(ag.status === "confirmado" || ag.status === "pendente") && <button onClick={() => atualizarStatus(ag.id, "nao_compareceu")} disabled={ocupado} title="Não compareceu" className="p-1.5 text-gray-500 hover:bg-[#1a1a1a] rounded transition"><Clock size={16} /></button>}
                              {ag.status === "nao_compareceu" && <button onClick={() => atualizarStatus(ag.id, "confirmado")} disabled={ocupado} title="Desfazer" className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition"><Undo2 size={13} /></button>}
                              {ag.status === "pendente" && <button onClick={() => atualizarStatus(ag.id, "confirmado")} disabled={ocupado} title="Confirmar" className="p-1.5 text-blue-400 hover:bg-blue-900/20 rounded transition"><MessageCircle size={16} /></button>}
                              {!finalizado && <button onClick={() => setReagendarAg(ag)} title="Reagendar" className="p-1.5 text-[#b8944a] hover:bg-[#b8944a]/10 rounded transition"><CalendarPlus size={16} /></button>}
                              {!finalizado && <button onClick={() => { setEditandoId(ag.id); const srvs = ag.servico.split(" + "); const precos = ag.preco.split(" + "); setEditLinhas(srvs.map((s, i) => ({ servico: s.trim(), preco: precos[i]?.trim() ?? "" }))); }} title="Editar" className="p-1.5 text-gray-500 hover:text-gray-300 rounded transition"><Pencil size={16} /></button>}
                              <button onClick={() => setModal({ tipo: "excluir", id: ag.id })} title="Remover" className="p-1.5 text-red-500/60 hover:text-red-400 rounded transition"><Trash2 size={16} /></button>
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

          {/* GRADE */}
          {aba === "grade" && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-3">Clique em um horário livre para adicionar cliente ou bloqueá-lo.</p>
              <div className={`${cardDark} divide-y divide-[#1a1a1a]`}>
                {todosSlotsDia.map((slot) => {
                  const agNoSlot = agsDia.find((a) => a.horario === slot);
                  const bloqueado = slotsBloqueados.includes(slot);
                  const livre = !agNoSlot && !bloqueado;
                  return (
                    <div key={slot} className={`flex items-center gap-3 px-4 py-3 ${bloqueado ? "bg-[#0A0A0A]" : ""}`}>
                      <span className="text-sm font-bold text-gray-500 w-12 flex-shrink-0">{slot}</span>
                      <div className="flex-1">
                        {agNoSlot ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#F5E6C8]">{agNoSlot.nome}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[agNoSlot.status]}`}>{STATUS_LABEL[agNoSlot.status]}</span>
                            <span className="text-xs text-gray-400">✂️ {agNoSlot.servico}</span>
                            {agNoSlot.preco && <span className="text-xs text-[#b8944a] font-medium">R$ {agNoSlot.preco}</span>}
                            {agNoSlot.cupom && <span className="text-xs px-1.5 py-0.5 bg-[#b8944a]/10 text-[#b8944a] border border-[#b8944a]/30 rounded font-mono">🏷️ {agNoSlot.cupom}</span>}
                          </div>
                        ) : bloqueado ? (
                          <span className="text-sm text-gray-500 flex items-center gap-1.5"><Ban size={13} className="text-red-500/70" /> Bloqueado pelo admin</span>
                        ) : (
                          <span className="text-sm text-green-500/80 font-medium">Disponível</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {agNoSlot && !caixaFechado && (
                          <>
                            {agNoSlot.status !== "cancelado" && agNoSlot.status !== "concluido" && <button onClick={() => setReagendarAg(agNoSlot)} title="Reagendar" className="p-1.5 text-[#b8944a] hover:bg-[#b8944a]/10 rounded transition"><CalendarPlus size={15} /></button>}
                            <button onClick={() => setModal({ tipo: "excluir", id: agNoSlot.id })} title="Remover" className="p-1.5 text-red-500/60 hover:text-red-400 rounded transition"><Trash2 size={15} /></button>
                          </>
                        )}
                        {livre && !caixaFechado && (
                          <>
                            <button onClick={() => setWalkInHorario(slot)} className="flex items-center gap-1 px-2 py-1 text-xs text-[#b8944a] border border-[#b8944a]/30 rounded hover:bg-[#b8944a]/10 transition"><CalendarPlus size={12} /> Agendar</button>
                            <button onClick={() => setModal({ tipo: "bloquear", horario: slot })} title="Bloquear" className="p-1.5 text-gray-500 hover:text-red-400 rounded transition"><Ban size={14} /></button>
                          </>
                        )}
                        {bloqueado && !caixaFechado && (
                          <button onClick={() => setModal({ tipo: "bloquear", horario: slot })} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition"><Unlock size={12} /> Desbloquear</button>
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
            <div className={`${cardDark} p-5`}>
              {caixaFechado ? (
                <div className="flex items-center gap-3 text-green-400">
                  <Lock size={18} />
                  <div>
                    <p className="font-semibold text-sm">Caixa fechado</p>
                    <p className="text-xs text-gray-500">{concluidos.length} serviços · Total R$ {totalDia.toFixed(2).replace(".", ",")}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-[#F5E6C8] text-sm">Fechar o caixa do dia</p>
                    <p className="text-xs text-gray-500 mt-0.5">Valide todos os atendimentos antes. Dados vão para o relatório financeiro.</p>
                  </div>
                  <button onClick={() => setModal({ tipo: "fechar_caixa" })} disabled={fechandoCaixa || concluidos.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold hover:bg-[#c9a84c] transition disabled:opacity-40 disabled:cursor-not-allowed rounded">
                    <Lock size={14} /> {fechandoCaixa ? "Fechando..." : "Fechar caixa"}
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
