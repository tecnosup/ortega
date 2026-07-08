"use client";

import { IconCalendarClock, IconCalendarPlus, IconFileText, IconLink } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Fab from "@/components/ui/Fab";
import { useToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/date-utils";

/**
 * FAB de ações rápidas, idêntico em todas as telas do admin
 * (Dashboard, Agendamentos, Financeiro). Fonte única das 4 ações.
 *
 * As ações "Agendar horário" e "Grade de hoje" navegam para a página de
 * agendamentos com um query param (?acao=), que lá dispara o comportamento
 * correspondente. As demais (link / comanda) funcionam de qualquer página.
 */
export default function AdminFab() {
  const router = useRouter();
  const toast = useToast();
  const hojeKey = toDateKey(new Date());

  async function copiarLink() {
    const url = `${window.location.origin}/agendamento`;
    try {
      await navigator.clipboard.writeText(url);
      toast.sucesso("Link de agendamento copiado!");
    } catch {
      toast.info(url);
    }
  }

  return (
    <Fab actions={[
      { label: "Agendar horário", icon: IconCalendarPlus, onClick: () => router.push("/admin/agendamentos?acao=agendar") },
      { label: "Link de agendamento", icon: IconLink, onClick: copiarLink },
      { label: "Abrir comanda", icon: IconFileText, onClick: () => router.push(`/admin/caixa?dia=${hojeKey}#caixa`) },
      { label: "Grade de hoje", icon: IconCalendarClock, onClick: () => router.push("/admin/agendamentos?acao=grade") },
    ]} />
  );
}
