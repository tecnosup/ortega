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
    // dois rAFs garantem que o browser pinte o estado inicial (hambúrguer)
    // antes de aplicar o estado aberto — sem isso a transição não dispara.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setMounted(true));
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [animateOnMount]);

  const isOpen = mounted && open;

  // transição inteira via inline style — imune ao purge do Tailwind, que não
  // gera classes arbitrárias de easing com vírgulas.
  const barBase: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    height: 2,
    width: 18,
    borderRadius: 9999,
    backgroundColor: "currentColor",
    transition: "transform 300ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease",
    transformOrigin: "center",
  };

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span style={{ ...barBase, transform: isOpen ? "translate(-50%,-50%) rotate(45deg)" : "translate(-50%,-50%) translateY(-6px)" }} />
      <span style={{ ...barBase, opacity: isOpen ? 0 : 1, transform: "translate(-50%,-50%)" }} />
      <span style={{ ...barBase, transform: isOpen ? "translate(-50%,-50%) rotate(-45deg)" : "translate(-50%,-50%) translateY(6px)" }} />
    </span>
  );
}
