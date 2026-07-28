"use client";

import { useEffect, useState } from "react";

/**
 * Ícone hambúrguer ⇄ X animado. As três barras transicionam suavemente:
 * a do meio some (opacidade), a de cima e a de baixo giram e se cruzam
 * formando o X quando `open` é true.
 *
 * `animateOnMount`: quando o ícone já monta no estado `open` (ex.: dentro de
 * um drawer que só existe quando aberto), parte do estado hambúrguer no
 * primeiro frame e transiciona para X, garantindo que a animação apareça.
 */
export default function MenuToggleIcon({
  open,
  size = 20,
  className = "",
  animateOnMount = false,
}: {
  open: boolean;
  size?: number;
  className?: string;
  animateOnMount?: boolean;
}) {
  const [mounted, setMounted] = useState(!animateOnMount);
  useEffect(() => {
    if (!animateOnMount) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [animateOnMount]);

  const isOpen = mounted && open;
  const bar =
    "absolute left-1/2 top-1/2 h-[2px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className={bar} style={{ transform: isOpen ? "translate(-50%,-50%) rotate(45deg)" : "translate(-50%,-50%) translateY(-6px)" }} />
      <span className={bar} style={{ opacity: isOpen ? 0 : 1, transform: "translate(-50%,-50%)" }} />
      <span className={bar} style={{ transform: isOpen ? "translate(-50%,-50%) rotate(-45deg)" : "translate(-50%,-50%) translateY(6px)" }} />
    </span>
  );
}
