"use client";

import { useEffect, useState } from "react";
import { useFaviconBadge } from "./useFaviconBadge";

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

  async function fetchNotificacoes() {
    try {
      const res = await fetch("/api/admin/notificacoes", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
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
