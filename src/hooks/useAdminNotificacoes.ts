"use client";

import { useEffect, useRef, useState } from "react";
import { useFaviconBadge } from "./useFaviconBadge";
import { playNovoAgendamento, playAtencao, playCritico } from "./useAdminSounds";

type Urgencia = "normal" | "atencao" | "critico";

interface Notificacoes {
  pendentes: number;
  hoje: number;
  total: number;
  urgencia: Urgencia;
}

export function useAdminNotificacoes() {
  const [data, setData] = useState<Notificacoes>({
    pendentes: 0,
    hoje: 0,
    total: 0,
    urgencia: "normal",
  });

  // refs para detectar delta entre polls
  const prevTotal = useRef<number | null>(null);
  const prevUrgencia = useRef<Urgencia | null>(null);
  const primeiroFetch = useRef(true);

  async function fetchNotificacoes() {
    try {
      const res = await fetch("/api/admin/notificacoes", { credentials: "include" });
      if (!res.ok) return;
      const json: Notificacoes = await res.json();

      // não toca som no primeiro fetch (carregamento inicial)
      if (!primeiroFetch.current) {
        const totalAnterior = prevTotal.current ?? 0;
        const urgenciaAnterior = prevUrgencia.current ?? "normal";

        if (json.total > totalAnterior) {
          // novo agendamento chegou
          playNovoAgendamento();
        } else if (json.urgencia === "critico" && urgenciaAnterior !== "critico") {
          // passou a ser crítico
          playCritico();
        } else if (json.urgencia === "atencao" && urgenciaAnterior === "normal") {
          // passou a atenção
          playAtencao();
        }
      }

      primeiroFetch.current = false;
      prevTotal.current = json.total;
      prevUrgencia.current = json.urgencia;
      setData(json);
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
