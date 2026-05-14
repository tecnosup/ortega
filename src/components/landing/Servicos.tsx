"use client";

import { Scissors, Clock, Tag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
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
  if (items.length === 0) return null;

  return (
    <section id="servicos" className="relative bg-[#0D0D0D]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent z-10" />

      <div className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-10 md:mb-14"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="w-8 h-px bg-[#C9A84C]" />
              <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">O que fazemos</span>
              <span className="w-8 h-px bg-[#C9A84C]" />
            </div>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Nossos serviços
            </h2>
          </motion.div>

          {/* desktop: grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item, idx) => {
              const desc = descontos?.get(item.id);
              const precoOrig = item.preco;
              const precoFinal = desc && precoOrig && !precoOrig.startsWith("A")
                ? precoComDesconto(precoOrig, desc.percentual)
                : null;

              return (
                <motion.div
                  key={item.id}
                  className="relative flex flex-col justify-between bg-white/[0.03] backdrop-blur-sm border border-[#C9A84C]/10 hover:border-[#C9A84C]/40 transition-all duration-500 group overflow-hidden"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: idx * 0.07 }}
                >
                  <span className="absolute bottom-4 right-5 text-[80px] font-black text-[#C9A84C]/4 leading-none select-none pointer-events-none">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#C9A84C]/30 group-hover:border-[#C9A84C]/70 transition-colors duration-300" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#C9A84C]/30 group-hover:border-[#C9A84C]/70 transition-colors duration-300" />

                  <div className="p-6 flex flex-col gap-4 relative z-10">
                    {desc && (
                      <span className="self-start bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-black px-3 py-1 tracking-widest uppercase">
                        -{desc.percentual}% OFF
                      </span>
                    )}
                    <div className="w-10 h-10 border border-[#C9A84C]/30 bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] group-hover:bg-[#C9A84C]/20 transition-colors duration-300">
                      <Scissors size={18} />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-bold text-[#F5E6C8] leading-tight mb-2"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {item.titulo}
                      </h3>
                      {item.descricao && (
                        <p className="text-[#F5E6C8]/45 text-sm leading-relaxed line-clamp-3">
                          {item.descricao}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6 flex flex-col gap-4 relative z-10">
                    <div className="flex items-center gap-4 pt-4 border-t border-[#C9A84C]/10">
                      {precoOrig && (
                        <span className="flex items-center gap-2">
                          <Tag size={12} className="text-[#C9A84C]" />
                          {precoFinal ? (
                            <span className="flex items-center gap-2">
                              <span className="text-xs line-through text-[#F5E6C8]/25">R$ {precoOrig}</span>
                              <span className="text-base font-bold text-[#C9A84C]">R$ {precoFinal}</span>
                            </span>
                          ) : (
                            <span className="text-base font-bold text-[#C9A84C]">
                              {precoOrig.startsWith("A") ? precoOrig : `R$ ${precoOrig}`}
                            </span>
                          )}
                        </span>
                      )}
                      {item.duracao && (
                        <span className="flex items-center gap-1.5 text-xs text-[#F5E6C8]/30">
                          <Clock size={12} /> {item.duracao}
                        </span>
                      )}
                    </div>
                    <a
                      href="/agendamento"
                      className="flex items-center justify-center gap-2 py-3 bg-[#C9A84C] text-[#0A0A0A] text-xs font-black tracking-widest uppercase hover:bg-[#E2C06A] active:scale-[0.97] transition-all duration-300"
                    >
                      Agendar agora <ArrowRight size={12} />
                    </a>
                  </div>
                </motion.div>
              );
            })}

            {/* card CTA final */}
            <motion.div
              className="relative flex flex-col items-center justify-center bg-[#C9A84C]/5 border border-[#C9A84C]/20 hover:bg-[#C9A84C]/10 transition-all duration-500 min-h-[280px]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: items.length * 0.07 }}
            >
              <div className="flex flex-col items-center gap-5 px-8 text-center">
                <div className="w-14 h-14 border-2 border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C]">
                  <Scissors size={24} />
                </div>
                <p className="text-lg font-bold text-[#F5E6C8] leading-snug" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Pronto para agendar?
                </p>
                <a
                  href="/agendamento"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#C9A84C] text-[#0A0A0A] text-xs font-black tracking-widest uppercase hover:bg-[#E2C06A] active:scale-[0.97] transition-all duration-300"
                >
                  Ver horários <ArrowRight size={13} />
                </a>
              </div>
            </motion.div>
          </div>

          {/* mobile: cards empilhados */}
          <div className="md:hidden flex flex-col gap-3">
            {items.map((item, idx) => {
              const desc = descontos?.get(item.id);
              const precoOrig = item.preco;
              const precoFinal = desc && precoOrig && !precoOrig.startsWith("A")
                ? precoComDesconto(precoOrig, desc.percentual)
                : null;

              return (
                <motion.div
                  key={item.id}
                  className="relative bg-white/[0.03] backdrop-blur-sm border border-[#C9A84C]/10 p-5 flex flex-col gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
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
                </motion.div>
              );
            })}

            <a
              href="/agendamento"
              className="mt-2 w-full flex items-center justify-center gap-2 py-4 bg-[#C9A84C] text-[#0A0A0A] text-sm font-black tracking-widest uppercase hover:bg-[#E2C06A] active:scale-[0.97] transition-all duration-300"
            >
              Agendar agora <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
