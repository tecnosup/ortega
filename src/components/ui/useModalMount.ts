"use client";

import { useEffect, useState } from "react";

/**
 * Mantém um modal montado durante a animação de SAÍDA.
 *
 * Muitos modais eram renderizados como `{cond && <MeuModal/>}`, o que desmonta
 * o componente na hora e impede o AnimatePresence interno do <Modal> de animar
 * a saída. Este hook resolve isso de forma padronizada:
 *
 *   const trigger = editando;              // valor que abre o modal (obj | null)
 *   const m = useModalMount(trigger);
 *   return m.mounted && (
 *     <MeuModal key={m.key} open={m.open} value={m.value} onClose={fechar} />
 *   );
 *
 * - `mounted`: continua true durante a saída (só vira false depois da animação).
 * - `open`: reflete se está abrindo/fechando (passe pro <Modal open={...}>).
 * - `key`: muda a cada abertura → reseta o estado do formulário do modal.
 * - `value`: o último valor não-nulo do trigger (pra o conteúdo não sumir na saída).
 */
export function useModalMount<T>(trigger: T | null | undefined, exitMs = 300) {
  const open = trigger != null;
  const [state, setState] = useState<{ value: T; key: number } | null>(null);

  useEffect(() => {
    if (trigger != null) {
      setState({ value: trigger, key: Date.now() });
    } else if (state) {
      // fechou: mantém montado durante a saída, depois desmonta
      const t = setTimeout(() => setState(null), exitMs);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return {
    mounted: state != null,
    open,
    key: state?.key ?? 0,
    value: state?.value as T,
  };
}
