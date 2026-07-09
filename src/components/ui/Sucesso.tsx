"use client";

/**
 * Feedback de sucesso global e consistente do sistema.
 *
 * É o PADRÃO OFICIAL de confirmação positiva — o check verde animado (mesmo do
 * fluxo de agendamentos). Use para ações concluídas relevantes (excluir, criar,
 * fechar caixa...). Some sozinho depois de ~1,5s.
 *
 *   const sucesso = useSucesso();
 *   sucesso("Gasto excluído");
 *
 * Deve estar dentro de <SucessoProvider>.
 */

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { IconCheck } from "@tabler/icons-react";
import { motion } from "framer-motion";
import Modal from "./Modal";

type SucessoFn = (mensagem: string) => void;

const SucessoContext = createContext<SucessoFn | null>(null);

export function SucessoProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sucesso = useCallback<SucessoFn>((mensagem) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(mensagem);
    timer.current = setTimeout(() => setMsg(null), 1500);
  }, []);

  return (
    <SucessoContext.Provider value={sucesso}>
      {children}
      <Modal
        open={!!msg}
        onClose={() => setMsg(null)}
        className="bg-[#141414] border border-green-700/40 rounded-2xl shadow-2xl px-8 py-9 max-w-[17rem] w-full mx-4 flex flex-col items-center gap-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center"
        >
          <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.18, type: "spring", stiffness: 500, damping: 16 }}>
            <IconCheck size={40} strokeWidth={3} className="text-green-400" />
          </motion.span>
        </motion.div>
        <p className="text-base font-bold text-[#F5E6C8] text-center leading-snug">{msg}</p>
      </Modal>
    </SucessoContext.Provider>
  );
}

/** Hook para disparar o feedback de sucesso de qualquer lugar. Fora do provider, é no-op. */
export function useSucesso(): SucessoFn {
  const ctx = useContext(SucessoContext);
  return ctx ?? (() => {});
}
