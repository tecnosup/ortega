"use client";

import { useEffect } from "react";

/**
 * Trava o scroll do fundo enquanto `locked` é true, sem mover a página
 * (usa overflow:hidden no <html> + compensação da largura da scrollbar,
 * pra não causar "salto" nem deslocamento lateral ao abrir/fechar).
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const scrollbarW = window.innerWidth - html.clientWidth;
    const prevOverflow = html.style.overflow;
    const prevPadding = html.style.paddingRight;
    html.style.overflow = "hidden";
    if (scrollbarW > 0) html.style.paddingRight = `${scrollbarW}px`;
    return () => {
      html.style.overflow = prevOverflow;
      html.style.paddingRight = prevPadding;
    };
  }, [locked]);
}
