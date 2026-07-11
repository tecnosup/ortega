"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

/**
 * Modo privacidade ("olho" estilo app de banco) para ocultar valores sensíveis.
 *
 * DECISÃO IMPORTANTE: começa SEMPRE oculto e o estado vive só em memória (não é
 * persistido). Assim a primeira renderização já nasce mascarada — não há aquele
 * flash de valores à mostra enquanto o app leria uma preferência (Firebase/
 * localStorage) de forma assíncrona. O olho revela apenas na sessão atual; ao
 * recarregar/abrir de novo, volta a ocultar.
 */
const Ctx = createContext<{ oculto: boolean; alternar: () => void } | null>(null);

export function PrivacidadeProvider({ children }: { children: React.ReactNode }) {
  const [oculto, setOculto] = useState(true);
  const alternar = useCallback(() => setOculto((o) => !o), []);
  return <Ctx.Provider value={{ oculto, alternar }}>{children}</Ctx.Provider>;
}

export function usePrivacidade() {
  // Fora do provider (não deve acontecer no admin) não mascara nada.
  return useContext(Ctx) ?? { oculto: false, alternar: () => {} };
}

/**
 * Retorna uma função que mascara a parte numérica de um texto de valor quando o
 * modo privacidade está ligado. Ex.: "R$ 1.234,56" → "R$ ••••" (mantém prefixo/
 * sufixo como "R$", "−", "/mês"). Fora disso, devolve o texto intacto.
 */
export function useMascara() {
  const { oculto } = usePrivacidade();
  return useCallback((texto: string) => (oculto ? texto.replace(/[\d.,]+/g, "••••") : texto), [oculto]);
}

/** Botão de olho reutilizável (financeiro, dashboard, etc.). */
export function BotaoPrivacidade({ className = "" }: { className?: string }) {
  const { oculto, alternar } = usePrivacidade();
  const Icon = oculto ? IconEyeOff : IconEye;
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oculto ? "Mostrar valores" : "Ocultar valores"}
      title={oculto ? "Mostrar valores" : "Ocultar valores"}
      className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
        oculto
          ? "bg-[#b8944a]/20 border-[#b8944a]/50 text-[#b8944a] hover:bg-[#b8944a]/30 shadow-sm shadow-[#b8944a]/20"
          : "bg-[#1a1a1a] border-[#2d2d2d] text-gray-300 hover:text-[#b8944a] hover:border-[#b8944a]/50"
      } ${className}`}
    >
      <Icon size={20} strokeWidth={2} />
    </button>
  );
}
