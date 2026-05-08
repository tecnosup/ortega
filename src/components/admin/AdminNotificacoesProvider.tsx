"use client";

import { useAdminNotificacoes } from "@/hooks/useAdminNotificacoes";

export function AdminNotificacoesProvider({ children }: { children: React.ReactNode }) {
  useAdminNotificacoes();
  return <>{children}</>;
}
