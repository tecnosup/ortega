"use client";

import { useState } from "react";
import {
  IconCalendarClock, IconCalendarPlus, IconCheck, IconFileText, IconLink,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Fab from "@/components/ui/Fab";
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
  const [toast, setToast] = useState<string | null>(null);
  const hojeKey = toDateKey(new Date());

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function copiarLink() {
    const url = `${window.location.origin}/agendamento`;
    try {
      await navigator.clipboard.writeText(url);
      mostrarToast("Link de agendamento copiado!");
    } catch {
      mostrarToast(url);
    }
  }

  return (
    <>
      <Fab actions={[
        { label: "Agendar horário", icon: IconCalendarPlus, onClick: () => router.push("/admin/agendamentos?acao=agendar") },
        { label: "Link de agendamento", icon: IconLink, onClick: copiarLink },
        { label: "Abrir comanda", icon: IconFileText, onClick: () => router.push(`/admin/caixa?dia=${hojeKey}#caixa`) },
        { label: "Grade de hoje", icon: IconCalendarClock, onClick: () => router.push("/admin/agendamentos?acao=grade") },
      ]} />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 bg-[#1a2a1a] border border-green-700/60 text-green-300 rounded-full px-4 py-2 shadow-xl text-sm font-medium"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <IconCheck size={15} className="text-green-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
