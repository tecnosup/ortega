"use client";

import { useEffect, useState } from "react";

interface Depoimento {
  id: string;
  nome: string;
  texto: string;
  estrelas: number;
}

export default function Depoimentos() {
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);

  useEffect(() => {
    fetch("/api/publico/depoimentos")
      .then((r) => r.json())
      .then((d) => setDepoimentos(d.depoimentos ?? []));
  }, []);

  return (
    <section id="depoimentos" className="py-20 md:py-28 bg-[#0A0A0A] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(201,168,76,0.04)_0%,transparent_70%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Clientes</span>
            <span className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8]">O que dizem sobre nós</h2>
        </div>

        {/* mobile: scroll horizontal snap / tablet+: grid */}
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {depoimentos.map((d) => (
            <div
              key={d.id}
              className="relative bg-[#141414] border border-[#C9A84C]/10 p-6 flex flex-col gap-4 hover:border-[#C9A84C]/30 transition-all shrink-0 w-[80vw] sm:w-[60vw] md:w-auto snap-center"
            >
              <span className="absolute top-4 right-5 text-5xl leading-none text-[#C9A84C]/10 font-serif select-none">"</span>
              <div className="flex gap-0.5 text-[#C9A84C] text-sm">{"★".repeat(d.estrelas)}</div>
              <p className="text-sm text-[#F5E6C8]/55 leading-relaxed italic flex-1">"{d.texto}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-[#C9A84C]/10">
                <div className="w-9 h-9 bg-[#C9A84C] flex items-center justify-center text-[#0A0A0A] text-xs font-bold shrink-0">
                  {d.nome.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-[#F5E6C8]">{d.nome}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
