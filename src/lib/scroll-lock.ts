/**
 * Trava o scroll do body de forma confiável — inclusive no iOS Safari, que
 * ignora `overflow: hidden` no body e continua rolando o fundo por toque.
 *
 * Técnica: fixa o body com `position: fixed` preservando a posição de scroll
 * atual em `top`, e restaura ao destravar. Usa contador de referência para
 * suportar múltiplos elementos (ex.: menu + drawer de alertas) abertos ao
 * mesmo tempo sem que o fechamento de um destrave o outro cedo demais.
 */

let lockCount = 0;
let savedScrollY = 0;

export function lockBodyScroll() {
  if (typeof document === "undefined") return;
  lockCount++;
  if (lockCount > 1) return; // já travado por outro consumidor

  savedScrollY = window.scrollY;
  const { style } = document.body;
  style.position = "fixed";
  style.top = `-${savedScrollY}px`;
  style.left = "0";
  style.right = "0";
  style.width = "100%";
  style.overflow = "hidden";
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) return;
  lockCount--;
  if (lockCount > 0) return; // ainda há outro consumidor mantendo o lock

  const { style } = document.body;
  style.position = "";
  style.top = "";
  style.left = "";
  style.right = "";
  style.width = "";
  style.overflow = "";
  window.scrollTo(0, savedScrollY);
}
