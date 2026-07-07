"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useScrollLock } from "./useScrollLock";

/**
 * Modal animado reutilizável.
 *
 * - No MOBILE: bottom-sheet — ocupa a largura toda, ancorado na base, sobe de baixo.
 * - No DESKTOP: modal centrado com fade + leve escala.
 *
 * O `className` define APENAS a aparência do painel (cor, borda, padding, largura
 * máxima no desktop). O posicionamento/comportamento bottom-sheet é controlado
 * internamente e não deve ser sobrescrito.
 */
export default function Modal({
  open,
  onClose,
  children,
  className = "",
  overlayClassName = "",
  hideClose = false,
}: {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  hideClose?: boolean;
}) {
  // Inicializa já com o valor correto (evita trocar a variante de animação após o
  // primeiro paint, o que travava o modal numa opacity intermediária).
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Trava o scroll do fundo enquanto o modal está aberto (sem mover a página).
  useScrollLock(open);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // O `animate` SEMPRE converge para opacity:1/scale:1/y:0 — assim, mesmo que
  // `isMobile` mude no meio da animação (troca de variante), o estado final é
  // sempre totalmente opaco (evita o modal ficar preso em opacity intermediária).
  const contentAnim = isMobile
    ? { initial: { opacity: 1, scale: 1, y: "100%" }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 1, scale: 1, y: "100%" } }
    : { initial: { opacity: 0, scale: 0.96, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 8 } };

  // Posicionamento controlado via style inline (prioridade máxima, não briga com className).
  // Mobile: sheet colado embaixo, largura total, canto arredondado só em cima.
  // Desktop: card centrado com margem.
  // IMPORTANTE: não colocar background no motion.div animado — o framer-motion
  // descarta o backgroundColor do style quando anima `y` (transform). O fundo
  // sólido fica num <div> interno estático.
  const wrapperStyle: React.CSSProperties = isMobile
    ? { position: "fixed", left: 0, right: 0, bottom: 0, width: "100%" }
    : {};

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[70] flex justify-center items-end sm:items-center bg-black/80 ${overlayClassName}`}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            style={wrapperStyle}
            {...contentAnim}
            transition={{ duration: isMobile ? 0.28 : 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* painel sólido — div ESTÁTICO com bg via classe Tailwind (nunca animado) */}
            <div
              style={isMobile ? { width: "100%", maxWidth: "100%", marginLeft: 0, marginRight: 0 } : undefined}
              className={`relative bg-[#141414] max-h-[90vh] overflow-y-auto ${isMobile ? "rounded-t-2xl" : ""} ${className}`}
            >
              {isMobile && (
                <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                  <span className="w-9 h-1 rounded-full bg-[#3d3d3d]" />
                </div>
              )}

              {!hideClose && onClose && (
                <motion.button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#F5E6C8] hover:bg-[#2d2d2d]/60 transition-colors"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ rotate: 180, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <X size={17} />
                </motion.button>
              )}

              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
