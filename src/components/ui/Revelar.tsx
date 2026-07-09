"use client";

/**
 * Revelar — transição padrão pra qualquer conteúdo que aparece/some.
 *
 * Regra do sistema: nada surge/desaparece "seco". Envolva blocos condicionais
 * (mensagens de erro, painéis, avisos) com <Revelar show={...}> pra ganhar
 * fade + altura + leve deslize, entrando e saindo.
 *
 *   <Revelar show={!!erro}><p className="...">{erro}</p></Revelar>
 */

import { AnimatePresence, motion } from "framer-motion";

export default function Revelar({
  show,
  children,
  className = "",
}: {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: "hidden" }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
