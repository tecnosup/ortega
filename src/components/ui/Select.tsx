"use client";

/**
 * Select padrão do sistema — substitui o <select> nativo.
 *
 * O dropdown é renderizado num PORTAL (position: fixed no body), ancorado no
 * botão via getBoundingClientRect. Assim ele nunca é cortado pelo overflow/rodapé
 * do modal, aparece sempre inteiro, e faz flip (abre pra cima quando não cabe
 * embaixo). Fecha ao escolher, no Esc, clicando fora ou ao rolar.
 *
 *   <Select value={freq} onChange={setFreq} options={[{ value, label }, ...]} />
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { IconCheck, IconChevronDown, IconPlus, IconSearch } from "@tabler/icons-react";

export interface SelectOption { value: string; label: string; }

const MAX_ALTURA = 260;

interface Pos { left: number; width: number; top?: number; bottom?: number; cima: boolean; max: number; }

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Selecionar",
  className = "",
  searchable = false,
  searchPlaceholder = "Buscar...",
  allowManual = false,
  onManual,
  displayLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  allowManual?: boolean;          // permite "usar o texto digitado" como item livre
  onManual?: (text: string) => void;
  displayLabel?: string;          // rótulo exibido quando o valor não está nas options (ex.: item manual)
}) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [montado, setMontado] = useState(false);
  const [busca, setBusca] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const sel = options.find((o) => o.value === value);
  const rotulo = sel?.label ?? displayLabel;

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, busca, searchable]);

  useEffect(() => { setMontado(true); }, []);

  function abrir() {
    const el = btnRef.current;
    if (!el) return;
    setBusca("");
    const r = el.getBoundingClientRect();
    const abaixo = window.innerHeight - r.bottom - 8;
    const acima = r.top - 8;
    const precisa = Math.min(MAX_ALTURA, options.length * 44 + 12 + (searchable ? 46 : 0));
    const cima = abaixo < precisa && acima > abaixo;
    const max = Math.min(MAX_ALTURA, Math.max(cima ? acima : abaixo, 120));
    setPos({
      left: r.left,
      width: r.width,
      top: cima ? undefined : r.bottom + 4,
      bottom: cima ? window.innerHeight - r.top + 4 : undefined,
      cima,
      max,
    });
    setAberto(true);
  }

  useEffect(() => {
    if (!aberto) return;
    const fechar = () => setAberto(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
      document.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        className={`w-full flex items-center justify-between gap-2 bg-[#0A0A0A] border rounded px-3 py-2 text-sm transition ${aberto ? "border-[#b8944a]" : "border-[#2d2d2d] hover:border-[#3d3d3d]"} ${rotulo ? "text-[#F5E6C8]" : "text-gray-500"}`}
      >
        <span className="truncate">{rotulo ?? placeholder}</span>
        <IconChevronDown size={15} className={`text-gray-500 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      {montado && createPortal(
        <AnimatePresence>
          {aberto && pos && (
            <>
              <div onMouseDown={() => setAberto(false)} className="fixed inset-0 z-[80]" />
              <motion.div
                initial={{ opacity: 0, y: pos.cima ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: pos.cima ? 6 : -6, scale: 0.98 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "fixed",
                  left: pos.left,
                  width: pos.width,
                  top: pos.top,
                  bottom: pos.bottom,
                  maxHeight: pos.max,
                  transformOrigin: pos.cima ? "bottom" : "top",
                  zIndex: 81,
                }}
                className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl flex flex-col overflow-hidden"
              >
                {searchable && (
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2d2d2d] shrink-0">
                    <IconSearch size={14} className="text-gray-500 shrink-0" />
                    <input
                      autoFocus
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full bg-transparent text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none"
                    />
                  </div>
                )}
                <div className="flex flex-col overflow-y-auto p-1.5">
                  {filtradas.map((o) => {
                    const ativo = o.value === value;
                    return (
                      <button
                        type="button"
                        key={o.value}
                        onClick={() => { onChange(o.value); setAberto(false); }}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left shrink-0 transition ${ativo ? "bg-[#b8944a]/15 text-[#b8944a] font-semibold" : "text-gray-300 hover:bg-[#1a1a1a] hover:text-[#F5E6C8]"}`}
                      >
                        <span className="truncate">{o.label}</span>
                        {ativo && <IconCheck size={14} className="shrink-0" />}
                      </button>
                    );
                  })}
                  {allowManual && busca.trim() && (
                    <button
                      type="button"
                      onClick={() => { onManual?.(busca.trim()); setAberto(false); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left shrink-0 text-amber-300 hover:bg-amber-950/40 transition border-t border-[#2d2d2d] mt-1 pt-2.5"
                    >
                      <IconPlus size={14} className="shrink-0" />
                      <span className="truncate">Usar “{busca.trim()}”</span>
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-amber-500/70 shrink-0">manual</span>
                    </button>
                  )}
                  {filtradas.length === 0 && !(allowManual && busca.trim()) && (
                    <p className="px-3 py-3 text-sm text-gray-500 text-center">Nenhum resultado</p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
