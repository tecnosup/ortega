"use client";

import { useState } from "react";
import { Scissors, Clock, Tag, ArrowRight } from "lucide-react";
import type { Item } from "@/lib/admin-items";
import type { Desconto } from "@/lib/admin-descontos";

interface ServicosProps {
  items: Item[];
  descontos?: Map<string, Desconto>;
}

function precoComDesconto(preco: string, pct: number) {
  const num = parseFloat(preco.replace(",", "."));
  if (isNaN(num)) return null;
  return (num * (1 - pct / 100)).toFixed(2).replace(".", ",");
}

export default function Servicos({ items, descontos }: ServicosProps) {
  const [ativo, setAtivo] = useState(0);

  if (items.length === 0) return null;

  const destaque = items[0];
  const resto = items.slice(1);
  const itemAtivo = items[ativo];
  const descontoAtivo = descontos?.get(itemAtivo.id);
  const precoAtivo = itemAtivo.preco;
  const precoFinalAtivo = descontoAtivo && precoAtivo && !precoAtivo.startsWith("A")
    ? precoComDesconto(precoAtivo, descontoAtivo.percentual)
    : null;

  return (
    <section id="servicos" className="py-20 md:py-28 bg-[#0D0D0D] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* cabeçalho */}
        <div className="text-center mb-10 md:mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">O que fazemos</span>
            <span className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >Nossos serviços</h2>
        </div>

        {/* layout desktop: vitrine + lista lateral */}
        <div className="hidden md:grid md:grid-cols-[1fr_400px] gap-0 border border-[#C9A84C]/10">

          {/* painel de destaque — muda conforme hover na lista */}
          <div className="relative bg-[#141414] p-10 flex flex-col justify-between min-h-[420px] overflow-hidden transition-all duration-500">
            {/* número grande decorativo */}
            <span className="absolute bottom-6 right-8 text-[120px] font-black text-[#C9A84C]/4 leading-none select-none pointer-events-none">
              {String(ativo + 1).padStart(2, "0")}
            </span>

            {/* canto decorativo */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#C9A84C]/30" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#C9A84C]/30" />

            {descontoAtivo && (
              <span className="self-start bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-black px-3 py-1 tracking-widest uppercase mb-4">
                -{descontoAtivo.percentual}% OFF
              </span>
            )}

            <div className="flex flex-col gap-5 relative z-10">
              <div className="w-12 h-12 border border-[#C9A84C]/30 bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C]">
                <Scissors size={22} />
              </div>

              <div>
                <h3
                  className="text-2xl md:text-3xl font-bold text-[#F5E6C8] leading-tight mb-3"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {itemAtivo.titulo}
                </h3>
                <p className="text-[#F5E6C8]/50 text-sm leading-relaxed max-w-sm">
                  {itemAtivo.descricao}
                </p>
              </div>

              <div className="flex items-center gap-5 pt-4 border-t border-[#C9A84C]/10">
                {precoAtivo && (
                  <span className="flex items-center gap-2">
                    <Tag size={14} className="text-[#C9A84C]" />
                    {precoFinalAtivo ? (
                      <span className="flex items-center gap-2">
                        <span className="text-sm line-through text-[#F5E6C8]/25">R$ {precoAtivo}</span>
                        <span className="text-xl font-bold text-[#C9A84C]">R$ {precoFinalAtivo}</span>
                      </span>
                    ) : (
                      <span className="text-xl font-bold text-[#C9A84C]">
                        {precoAtivo.startsWith("A") ? precoAtivo : `R$ ${precoAtivo}`}
                      </span>
                    )}
                  </span>
                )}
                {itemAtivo.duracao && (
                  <span className="flex items-center gap-1.5 text-sm text-[#F5E6C8]/35">
                    <Clock size={13} /> {itemAtivo.duracao}
                  </span>
                )}
              </div>

              <a
                href="/agendamento"
                className="self-start flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-[#0A0A0A] text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:bg-[#E2C06A] hover:shadow-[0_0_32px_rgba(201,168,76,0.5)] active:scale-[0.97] transition-all duration-300"
              >
                Agendar agora <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* lista lateral */}
          <div className="border-l border-[#C9A84C]/10 flex flex-col divide-y divide-[#C9A84C]/10">
            {items.map((item, idx) => {
              const desc = descontos?.get(item.id);
              const isAtivo = ativo === idx;
              return (
                <button
                  key={item.id}
                  onMouseEnter={() => setAtivo(idx)}
                  onClick={() => setAtivo(idx)}
                  className={`group w-full text-left px-6 py-5 flex items-start gap-4 transition-all duration-300 ${
                    isAtivo ? "bg-[#C9A84C]/8" : "hover:bg-[#C9A84C]/4"
                  }`}
                >
                  <span className={`text-xs font-black mt-0.5 shrink-0 transition-colors ${
                    isAtivo ? "text-[#C9A84C]" : "text-[#C9A84C]/30"
                  }`}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm transition-colors ${
                      isAtivo ? "text-[#F5E6C8]" : "text-[#F5E6C8]/60 group-hover:text-[#F5E6C8]/80"
                    }`}>
                      {item.titulo}
                    </p>
                    {item.preco && (
                      <p className="text-xs text-[#C9A84C]/70 mt-0.5">
                        {item.preco.startsWith("A") ? item.preco : `R$ ${item.preco}`}
                        {desc ? <span className="ml-1.5 text-[#C9A84C] font-bold">-{desc.percentual}%</span> : ""}
                      </p>
                    )}
                  </div>
                  <div className={`w-1 self-stretch rounded-full transition-all duration-300 shrink-0 ${
                    isAtivo ? "bg-[#C9A84C]" : "bg-transparent"
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* layout mobile: cards empilhados */}
        <div className="md:hidden flex flex-col gap-3">
          {items.map((item, idx) => {
            const desc = descontos?.get(item.id);
            const precoOrig = item.preco;
            const precoFinal = desc && precoOrig && !precoOrig.startsWith("A")
              ? precoComDesconto(precoOrig, desc.percentual)
              : null;

            return (
              <div
                key={item.id}
                className="relative bg-[#141414] border border-[#C9A84C]/10 p-5 flex flex-col gap-3 active:border-[#C9A84C]/40 transition-all"
              >
                {desc && (
                  <span className="absolute top-3 right-3 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                    -{desc.percentual}%
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-[#C9A84C]/20 leading-none">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-semibold text-[#F5E6C8] text-base">{item.titulo}</h3>
                </div>
                {item.descricao && (
                  <p className="text-sm text-[#F5E6C8]/40 leading-relaxed">{item.descricao}</p>
                )}
                <div className="flex items-center gap-4 pt-2 border-t border-[#C9A84C]/10 text-sm">
                  {precoOrig && (
                    <span className="flex items-center gap-1.5">
                      <Tag size={12} className="text-[#C9A84C]" />
                      {precoFinal ? (
                        <>
                          <span className="line-through text-[#F5E6C8]/25 text-xs">R$ {precoOrig}</span>
                          <span className="font-bold text-[#C9A84C]">R$ {precoFinal}</span>
                        </>
                      ) : (
                        <span className="font-bold text-[#C9A84C]">
                          {precoOrig.startsWith("A") ? precoOrig : `R$ ${precoOrig}`}
                        </span>
                      )}
                    </span>
                  )}
                  {item.duracao && (
                    <span className="flex items-center gap-1.5 text-[#F5E6C8]/30">
                      <Clock size={12} /> {item.duracao}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <a
            href="/agendamento"
            className="mt-2 w-full flex items-center justify-center gap-2 py-4 bg-[#C9A84C] text-[#0A0A0A] text-sm font-black tracking-widest uppercase shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:bg-[#E2C06A] active:scale-[0.97] transition-all duration-300"
          >
            Agendar agora <ArrowRight size={14} />
          </a>
        </div>

        {/* CTA desktop */}
        <div className="hidden md:flex justify-center mt-10">
          <a
            href="/agendamento"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#C9A84C] text-[#0A0A0A] text-sm font-black tracking-widest uppercase shadow-[0_0_24px_rgba(201,168,76,0.35)] hover:bg-[#E2C06A] hover:shadow-[0_0_36px_rgba(201,168,76,0.55)] active:scale-[0.97] transition-all duration-300"
          >
            Agendar agora <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
