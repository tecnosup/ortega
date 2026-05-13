"use client";

import { useEffect, useRef, useState } from "react";
import { useFaviconBadge } from "./useFaviconBadge";
import { playNovoAgendamento, playAtencao, playCritico } from "./useAdminSounds";

type Urgencia = "normal" | "atencao" | "critico";

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
  financeiro: number;
  caixasAbertos: number;
  caixasAbertosLista: string[];
  vencimentos: number;
  vencimentosLista: VencimentoItem[];
  urgenciaFinanceiro: Urgencia;
}

const INITIAL: Notificacoes = {
  pendentes: 0, hoje: 0, total: 0, urgencia: "normal",
  financeiro: 0, caixasAbertos: 0, caixasAbertosLista: [],
  vencimentos: 0, vencimentosLista: [], urgenciaFinanceiro: "normal",
};

export function useAdminNotificacoes() {
  const [data, setData] = useState<Notificacoes>(INITIAL);

  const prevTotal = useRef<number | null>(null);
  const prevUrgencia = useRef<Urgencia | null>(null);
  const primeiroFetch = useRef(true);

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

      primeiroFetch.current = false;
      prevTotal.current = merged.total;
      prevUrgencia.current = merged.urgencia;
      setData(merged);
    } catch {
      // silencia erros de rede
    }
  }

  useEffect(() => {
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 30_000);
    return () => clearInterval(interval);
  }, []);

  useFaviconBadge(data.total, data.urgencia);

  return data;
}
