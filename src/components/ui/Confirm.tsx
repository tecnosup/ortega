"use client";

/**
 * Diálogo de confirmação global e consistente do sistema.
 *
 * É o PADRÃO OFICIAL de confirmação — mesmo visual/comportamento do modal de
 * agendamentos (título, mensagem, Cancelar + ação colorida, com animação).
 * Substitui o confirm() nativo do navegador.
 *
 * Devolve Promise<boolean> — use dentro de um handler async:
 *
 *   const confirmar = useConfirm();
 *   if (!(await confirmar("Excluir este gasto?"))) return;
 *
 *   // ou com opções:
 *   if (!(await confirmar({ titulo: "Excluir gasto", mensagem: "Ação irreversível.", confirmar: "Excluir" }))) return;
 *
 * Deve estar dentro de <ConfirmProvider>.
 */

import { createContext, useCallback, useContext, useRef, useState } from "react";
import Modal from "./Modal";

export type TomConfirm = "perigo" | "ouro" | "verde" | "cinza";

export interface ConfirmOpts {
  titulo?: string;
  mensagem: string;
  confirmar?: string;   // label do botão de confirmar
  cancelar?: string;    // label do botão de cancelar
  perigo?: boolean;     // atalho: true = ação destrutiva (vermelho). default: true
  tom?: TomConfirm;     // controle fino da cor da ação (tem prioridade sobre `perigo`)
}

type ConfirmFn = (opts: ConfirmOpts | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

const TOM_CLASS: Record<TomConfirm, string> = {
  perigo: "bg-red-600 hover:bg-red-500 text-white",
  ouro:   "bg-[#b8944a] hover:bg-[#c9a84c] text-[#0A0A0A]",
  verde:  "bg-green-700 hover:bg-green-600 text-white",
  cinza:  "bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white",
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const [open, setOpen] = useState(false);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirmar = useCallback<ConfirmFn>((o) => {
    setOpts(typeof o === "string" ? { mensagem: o } : o);
    setOpen(true);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const responder = useCallback((v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setOpen(false);
  }, []);

  const tom: TomConfirm = opts?.tom ?? (opts?.perigo === false ? "ouro" : "perigo");

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      <Modal
        open={open}
        onClose={() => responder(false)}
        className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4"
      >
        {opts?.titulo && <h3 className="font-bold text-[#F5E6C8]">{opts.titulo}</h3>}
        <div className="text-sm text-gray-400 leading-relaxed">{opts?.mensagem}</div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => responder(false)}
            className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition"
          >
            {opts?.cancelar ?? "Cancelar"}
          </button>
          <button
            onClick={() => responder(true)}
            className={`px-4 py-2 text-sm rounded transition ${TOM_CLASS[tom]}`}
          >
            {opts?.confirmar ?? "Confirmar"}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** Hook para pedir confirmação de qualquer lugar. Fora do provider, cai no confirm() nativo. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async (o) => window.confirm(typeof o === "string" ? o : o.mensagem);
  }
  return ctx;
}
