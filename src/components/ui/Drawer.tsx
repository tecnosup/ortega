"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

/**
 * Drawer animado reutilizável — desliza de um lado da tela com overlay fade.
 * Animação de entrada E saída via AnimatePresence.
 *
 * Uso:
 *   <Drawer open={aberto} onClose={fechar} side="right">
 *     ...conteúdo...
 *   </Drawer>
 */
export default function Drawer({
  open,
  onClose,
  children,
  side = "left",
  className = "",
  overlayClassName = "",
}: {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
  overlayClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const hidden = side === "left" ? "-100%" : "100%";
  const sideClass = side === "left" ? "left-0" : "right-0";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm ${overlayClassName}`}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
          <motion.div
            className={`fixed top-0 ${sideClass} z-50 h-full ${className}`}
            initial={{ x: hidden }}
            animate={{ x: 0 }}
            exit={{ x: hidden }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
