"use client";

import { useEffect, useRef, useState } from "react";
import { useFaviconBadge } from "./useFaviconBadge";
import { playNovoAgendamento, playAtencao, playCritico } from "./useAdminSounds";

type Urgencia = "normal" | "atencao" | "critico";

const INTERVALO_POLLING_MS = 120_000;
const JANELA_LEMBRETE_MIN_MS = 30 * 60_000;
const JANELA_LEMBRETE_MAX_MS = 60 * 60_000;

export interface AgendamentoProximo {
  id: string;
  nome: string;
  servico: string;
  data: string;
  horario: string;
}

export interface PendenteItem {
  id: string;
  nome: string;
  servico: string;
  data: string;
  horario: string;
  atrasado: boolean;
}

export interface VencimentoItem {
  id: string;
  descricao: string;
  data: string;
  dias: number;
  valor: number;
  frequencia: string;
}

interface Notificacoes {
  pendentes: number;
  hoje: number;
  total: number;
  urgencia: Urgencia;
  agendamentosHoje: AgendamentoProximo[];
  pendentesLista: PendenteItem[];
  financeiro: number;
  caixasAbertos: number;
  caixasAbertosLista: string[];
  vencimentos: number;
  vencimentosLista: VencimentoItem[];
  urgenciaFinanceiro: Urgencia;
}

const INITIAL: Notificacoes = {
  pendentes: 0, hoje: 0, total: 0, urgencia: "normal", agendamentosHoje: [], pendentesLista: [],
  financeiro: 0, caixasAbertos: 0, caixasAbertosLista: [],
  vencimentos: 0, vencimentosLista: [], urgenciaFinanceiro: "normal",
};

function notificarLembreteLocal(ag: AgendamentoProximo) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;
  new Notification(`⏰ Agendamento em breve`, {
    body: `${ag.nome} · ${ag.servico} às ${ag.horario}`,
    icon: "/icons/icon-192.png",
  });
}

export function useAdminNotificacoes() {
  const [data, setData] = useState<Notificacoes>(INITIAL);

  const prevTotal = useRef<number | null>(null);
  const prevUrgencia = useRef<Urgencia | null>(null);
  const primeiroFetch = useRef(true);
  const lembretesEnviados = useRef<Set<string>>(new Set());

  async function fetchNotificacoes() {
    try {
      const res = await fetch("/api/admin/notificacoes", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json() as Partial<Notificacoes>;
      const merged: Notificacoes = { ...INITIAL, ...json };

      if (!primeiroFetch.current) {
        const totalAnterior = prevTotal.current ?? 0;
        const urgenciaAnterior = prevUrgencia.current ?? "normal";
        if (merged.total > totalAnterior) playNovoAgendamento();
        else if (merged.urgencia === "critico" && urgenciaAnterior !== "critico") playCritico();
        else if (merged.urgencia === "atencao" && urgenciaAnterior === "normal") playAtencao();
      }

      // lembrete local de agendamento entrando na janela de 30-60min
      const agora = Date.now();
      for (const ag of merged.agendamentosHoje) {
        if (lembretesEnviados.current.has(ag.id)) continue;
        const ts = new Date(`${ag.data}T${ag.horario}:00`).getTime();
        const restante = ts - agora;
        if (restante > 0 && restante <= JANELA_LEMBRETE_MAX_MS && restante >= JANELA_LEMBRETE_MIN_MS - INTERVALO_POLLING_MS) {
          notificarLembreteLocal(ag);
          lembretesEnviados.current.add(ag.id);
        }
      }

      primeiroFetch.current = false;
      prevTotal.current = merged.total;
      prevUrgencia.current = merged.urgencia;
      setData(merged);
    } catch {
      // silencia erros de rede
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    function iniciarPolling() {
      if (interval) return;
      fetchNotificacoes();
      interval = setInterval(fetchNotificacoes, INTERVALO_POLLING_MS);
    }
    function pararPolling() {
      if (interval) { clearInterval(interval); interval = null; }
    }
    function onVisibilityChange() {
      if (document.hidden) pararPolling();
      else iniciarPolling();
    }

    // Só faz polling com a aba visível — economiza leituras do Firestore
    if (!document.hidden) iniciarPolling();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      pararPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useFaviconBadge(data.total, data.urgencia);

  return data;
}
