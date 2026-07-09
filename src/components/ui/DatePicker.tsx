"use client";

/**
 * Seletor de data padrão do sistema — substitui o <input type="date"> nativo
 * (fora do visual do site). Mesmo visual do calendário de agendamentos:
 * navegação por mês, "Dom Seg Ter…", dia selecionado dourado, hoje contornado.
 *
 *   <DatePicker value={data} onChange={setData} max={hojeISO} />
 *
 * value/onChange usam string no formato "YYYY-MM-DD" (ou "" quando vazio).
 */

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function keyDia(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Selecionar data",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
}) {
  const hoje = hojeISO();
  const base = value ? new Date(value + "T12:00:00") : new Date();
  const [aberto, setAberto] = useState(false);
  const [view, setView] = useState({ year: base.getFullYear(), month: base.getMonth() });
  const painelRef = useRef<HTMLDivElement>(null);

  function navMes(delta: number) {
    setView((v) => {
      let m = v.month + delta, y = v.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  }

  const { year, month } = view;
  const primeiroDiaSemana = new Date(year, month, 1).getDay();
  const diasNoMes = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];
  const nomeMes = new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const label = value
    ? new Date(value + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    : placeholder;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className={`w-full flex items-center justify-between gap-2 bg-[#0A0A0A] border rounded px-3 py-2 text-sm transition ${aberto ? "border-[#b8944a]" : "border-[#2d2d2d] hover:border-[#3d3d3d]"} ${value ? "text-[#F5E6C8]" : "text-gray-500"}`}
      >
        <span className="capitalize truncate">{label}</span>
        <IconCalendar size={15} className="text-gray-500 shrink-0" />
      </button>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            ref={painelRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => { if (aberto) painelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }}
            className="overflow-hidden"
          >
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 mt-2 select-none">
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => navMes(-1)} className="p-1.5 text-gray-400 hover:text-[#b8944a] transition rounded-lg hover:bg-[#1a1a1a]">
                  <IconChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-[#F5E6C8] capitalize">{nomeMes}</span>
                <button type="button" onClick={() => navMes(1)} className="p-1.5 text-gray-400 hover:text-[#b8944a] transition rounded-lg hover:bg-[#1a1a1a]">
                  <IconChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA.map((d, i) => (
                  <div key={d} className={`text-center text-[10px] font-semibold py-1 ${i === 0 ? "text-red-500/60" : "text-gray-600"}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((dia, i) => {
                  if (!dia) return <div key={i} className="h-9" />;
                  const key = keyDia(year, month, dia);
                  const selecionado = key === value;
                  const isHoje = key === hoje;
                  const desabilitado = (!!min && key < min) || (!!max && key > max);
                  return (
                    <button
                      type="button"
                      key={key}
                      disabled={desabilitado}
                      onClick={() => { onChange(key); setAberto(false); }}
                      className={`w-full h-9 flex items-center justify-center rounded-lg text-xs font-medium transition-all
                        ${selecionado
                          ? "bg-[#b8944a] text-[#0A0A0A] shadow-[0_0_12px_rgba(184,148,74,0.3)] font-bold"
                          : desabilitado
                          ? "text-gray-700 cursor-not-allowed"
                          : isHoje
                          ? "border-2 border-[#b8944a]/70 text-[#b8944a]"
                          : "text-gray-400 hover:bg-[#1a1a1a] hover:text-[#F5E6C8]"
                        }`}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3 mt-3 border-t border-[#1a1a1a]">
                <button
                  type="button"
                  onClick={() => { onChange(hoje); setView({ year: new Date().getFullYear(), month: new Date().getMonth() }); setAberto(false); }}
                  className="text-[11px] font-semibold text-[#b8944a] hover:text-[#c9a84c] transition"
                >
                  Hoje
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
