"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useScrollLock } from "./useScrollLock";

export interface FabAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

/**
 * Botão flutuante (+) que gira ao abrir e revela ações em leque (de baixo pra cima).
 * Estilo: pílulas com rótulo à esquerda e ícone dourado à direita.
 */
export default function Fab({ actions }: { actions: FabAction[] }) {
  const [open, setOpen] = useState(false);

  // trava o scroll do fundo quando o menu está aberto
  useScrollLock(open);

  // fecha ao apertar ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function run(fn: () => void) {
    setOpen(false);
    fn();
  }

  return (
    <>
      {/* overlay que escurece e fecha ao tocar fora */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* container do FAB — acima da bottom nav no mobile */}
      <div className="fixed right-5 z-50 flex flex-col items-end gap-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}>

        {/* ações em leque */}
        <AnimatePresence>
          {open && (
            <div className="flex flex-col items-end gap-3 mb-1">
              {actions.map((a, i) => {
                const Icon = a.icon;
                // aparecem de baixo (mais perto do +) pra cima, com stagger
                const delay = (actions.length - 1 - i) * 0.04;
                return (
                  <motion.button
                    key={a.label}
                    onClick={() => run(a.onClick)}
                    className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full bg-[#1a1a1a] border border-[#2d2d2d] shadow-lg hover:border-[#b8944a]/50 transition-colors"
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay } }}
                    exit={{ opacity: 0, y: 12, scale: 0.9, transition: { delay } }}
                  >
                    <span className="text-sm font-medium text-[#F5E6C8] whitespace-nowrap">{a.label}</span>
                    <span className="w-8 h-8 rounded-full bg-[#b8944a]/15 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-[#b8944a]" />
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* botão principal + / × */}
        <motion.button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu de ações"}
          className="w-14 h-14 rounded-full bg-[#b8944a] text-[#0A0A0A] shadow-xl flex items-center justify-center hover:bg-[#c9a84c] transition-colors"
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: open ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </motion.button>
      </div>
    </>
  );
}
