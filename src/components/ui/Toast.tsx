"use client";

/**
 * Sistema de toast global e consistente do sistema.
 *
 * Padrão OBRIGATÓRIO de feedback: toda ação que confirma, edita, cancela ou exclui
 * algo deve disparar um toast via useToast(). Aparece sempre no mesmo lugar, mesmo
 * estilo, em qualquer tela.
 *
 * Uso:
 *   const toast = useToast();
 *   toast.sucesso("Comanda finalizada!");
 *   toast.info("Caixa reaberto");
 *   toast.erro("Não foi possível excluir");
 */

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconCheck, IconInfoCircle, IconAlertTriangle } from "@tabler/icons-react";

type ToastTipo = "sucesso" | "info" | "erro";
interface ToastItem { id: number; msg: string; tipo: ToastTipo; }

interface ToastApi {
  sucesso: (msg: string) => void;
  info: (msg: string) => void;
  erro: (msg: string) => void;
  mostrar: (msg: string, tipo?: ToastTipo) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ESTILO: Record<ToastTipo, { cls: string; icon: typeof IconCheck; iconCls: string }> = {
  sucesso: { cls: "bg-[#1a2a1a] border-green-700/60 text-green-300", icon: IconCheck, iconCls: "text-green-400" },
  info:    { cls: "bg-[#1a1a2a] border-[#b8944a]/50 text-[#F5E6C8]", icon: IconInfoCircle, iconCls: "text-[#b8944a]" },
  erro:    { cls: "bg-[#2a1a1a] border-red-700/60 text-red-300", icon: IconAlertTriangle, iconCls: "text-red-400" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const mostrar = useCallback((msg: string, tipo: ToastTipo = "sucesso") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const api: ToastApi = {
    mostrar,
    sucesso: useCallback((m: string) => mostrar(m, "sucesso"), [mostrar]),
    info: useCallback((m: string) => mostrar(m, "info"), [mostrar]),
    erro: useCallback((m: string) => mostrar(m, "erro"), [mostrar]),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Pilha de toasts — canto inferior central, acima da bottom-nav mobile */}
      <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(({ id, msg, tipo }) => {
            const { cls, icon: Icon, iconCls } = ESTILO[tipo];
            return (
              <motion.div
                key={id}
                className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-xl text-sm font-medium border ${cls}`}
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon size={15} className={`shrink-0 ${iconCls}`} />
                {msg}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/** Hook para disparar toasts de qualquer lugar. Deve estar dentro de <ToastProvider>. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback seguro fora do provider (não quebra render; loga)
    return {
      mostrar: (m) => console.warn("[toast fora do provider]", m),
      sucesso: (m) => console.warn("[toast fora do provider]", m),
      info: (m) => console.warn("[toast fora do provider]", m),
      erro: (m) => console.warn("[toast fora do provider]", m),
    };
  }
  return ctx;
}
