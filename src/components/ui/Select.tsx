"use client";

/**
 * Select padrão do sistema — substitui o <select> nativo.
 *
 * A lista SOBREPÕE o conteúdo (popover) e faz FLIP: abre pra baixo por padrão,
 * mas pra cima quando não há espaço embaixo (ex.: perto do rodapé do modal) —
 * assim aparece sempre inteira, sem precisar rolar. Limita a altura ao espaço
 * disponível e rola dentro dela se tiver muitas opções. Fecha ao escolher,
 * no Esc ou clicando fora.
 *
 *   <Select value={freq} onChange={setFreq} options={[{ value, label }, ...]} />
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";

export interface SelectOption { value: string; label: string; }

const MAX_ALTURA = 240;

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Selecionar",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<{ cima: boolean; max: number }>({ cima: false, max: MAX_ALTURA });
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const sel = options.find((o) => o.value === value);

  function abrir() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const abaixo = window.innerHeight - r.bottom - 12;
      const acima = r.top - 12;
      const cima = abaixo < Math.min(MAX_ALTURA, options.length * 44 + 12) && acima > abaixo;
      const max = Math.min(MAX_ALTURA, Math.max(cima ? acima : abaixo, 120));
      setPos({ cima, max });
    }
    setAberto(true);
  }

  useEffect(() => {
    if (!aberto) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setAberto(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [aberto]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        className={`w-full flex items-center justify-between gap-2 bg-[#0A0A0A] border rounded px-3 py-2 text-sm transition ${aberto ? "border-[#b8944a]" : "border-[#2d2d2d] hover:border-[#3d3d3d]"} ${sel ? "text-[#F5E6C8]" : "text-gray-500"}`}
      >
        <span className="truncate">{sel?.label ?? placeholder}</span>
        <IconChevronDown size={15} className={`text-gray-500 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: pos.cima ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: pos.cima ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: pos.cima ? "bottom" : "top", maxHeight: pos.max }}
            className={`absolute left-0 right-0 z-50 bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl p-1.5 flex flex-col overflow-y-auto ${pos.cima ? "bottom-full mb-1" : "top-full mt-1"}`}
          >
            {options.map((o) => {
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
