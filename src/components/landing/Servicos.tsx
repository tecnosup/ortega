"use client";

import { useEffect, useRef } from "react";
import { Scissors, Clock, Tag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Item } from "@/lib/admin-items";
import type { Desconto } from "@/lib/admin-descontos";

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef  = useRef<HTMLElement>(null);
  const pinWrapRef  = useRef<HTMLDivElement>(null);
  const trackRef    = useRef<HTMLDivElement>(null);
  const mobileRef   = useRef<HTMLDivElement>(null);

  /* ---- horizontal scroll desktop ---- */
  useEffect(() => {
    if (!pinWrapRef.current || !trackRef.current) return;

    const track = trackRef.current;
    const totalWidth = track.scrollWidth - track.offsetWidth;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -totalWidth,
        ease: "none",
        scrollTrigger: {
          trigger: pinWrapRef.current,
          start: "top top",
          end: () => `+=${totalWidth + window.innerHeight * 0.5}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, pinWrapRef);

    return () => ctx.revert();
  }, [items]);

  /* ---- mobile: cards entram em cascata ---- */
  useEffect(() => {
    if (!mobileRef.current) return;
    const cards = mobileRef.current.querySelectorAll<HTMLElement>(".gsap-card");
    const ctx = gsap.context(() => {
      gsap.fromTo(cards,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: mobileRef.current, start: "top 85%", once: true } }
      );
    }, mobileRef);
    return () => ctx.revert();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <section ref={sectionRef} id="servicos" className="relative bg-[#0D0D0D]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent z-10" />

      {/* ========= DESKTOP: horizontal pin scroll ========= */}
      <div ref={pinWrapRef} className="hidden md:block h-screen" style={{ overflow: "hidden" }}>

        {/* header fixo acima da trilha */}
        <div className="pt-20 pb-10 max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center"
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
              className="text-3xl md:text-4xl font-bold text-[#F5E6C8]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Nossos serviços
            </h2>
          </motion.div>
        </div>

        {/* trilha horizontal */}
        <div
          ref={trackRef}
          className="flex gap-6 px-[max(2rem,calc((100vw-72rem)/2))] pb-10 will-change-transform"
          style={{ width: "max-content" }}
        >
          {items.map((item, idx) => {
            const desc = descontos?.get(item.id);
            const precoOrig = item.preco;
            const precoFinal = desc && precoOrig && !precoOrig.startsWith("A")
              ? precoComDesconto(precoOrig, desc.percentual)
              : null;

            return (
              <div
                key={item.id}
                className="relative flex flex-col justify-between bg-white/[0.03] backdrop-blur-sm border border-[#C9A84C]/10 hover:border-[#C9A84C]/40 transition-all duration-500 group overflow-hidden"
                style={{ width: 320, height: "clamp(320px, calc(100vh - 220px), 480px)" }}
              >
                {/* número decorativo */}
                <span className="absolute bottom-4 right-5 text-[100px] font-black text-[#C9A84C]/4 leading-none select-none pointer-events-none">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* cantos dourados */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#C9A84C]/30 group-hover:border-[#C9A84C]/70 transition-colors duration-300" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#C9A84C]/30 group-hover:border-[#C9A84C]/70 transition-colors duration-300" />

                <div className="p-8 flex flex-col gap-5 relative z-10">
                  {desc && (
                    <span className="self-start bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-black px-3 py-1 tracking-widest uppercase">
                      -{desc.percentual}% OFF
                    </span>
                  )}

                  <div className="w-11 h-11 border border-[#C9A84C]/30 bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] group-hover:bg-[#C9A84C]/20 transition-colors duration-300">
                    <Scissors size={20} />
                  </div>

                  <div>
                    <h3
                      className="text-xl font-bold text-[#F5E6C8] leading-tight mb-2"
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

                <div className="px-8 pb-8 flex flex-col gap-4 relative z-10">
                  <div className="flex items-center gap-4 pt-4 border-t border-[#C9A84C]/10">
                    {precoOrig && (
                      <span className="flex items-center gap-2">
                        <Tag size={13} className="text-[#C9A84C]" />
                        {precoFinal ? (
                          <span className="flex items-center gap-2">
                            <span className="text-sm line-through text-[#F5E6C8]/25">R$ {precoOrig}</span>
                            <span className="text-lg font-bold text-[#C9A84C]">R$ {precoFinal}</span>
                          </span>
                        ) : (
                          <span className="text-lg font-bold text-[#C9A84C]">
                            {precoOrig.startsWith("A") ? precoOrig : `R$ ${precoOrig}`}
                          </span>
                        )}
                      </span>
                    )}
                    {item.duracao && (
                      <span className="flex items-center gap-1.5 text-sm text-[#F5E6C8]/30">
                        <Clock size={13} /> {item.duracao}
                      </span>
                    )}
                  </div>

                  <a
                    href="/agendamento"
                    className="flex items-center justify-center gap-2 py-3 bg-[#C9A84C] text-[#0A0A0A] text-xs font-black tracking-widest uppercase shadow-[0_0_16px_rgba(201,168,76,0.2)] hover:bg-[#E2C06A] hover:shadow-[0_0_28px_rgba(201,168,76,0.45)] active:scale-[0.97] transition-all duration-300"
                  >
                    Agendar agora <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            );
          })}

          {/* card CTA final */}
          <div
            className="relative flex flex-col items-center justify-center bg-[#C9A84C]/5 border border-[#C9A84C]/20 hover:bg-[#C9A84C]/10 transition-all duration-500 shrink-0"
            style={{ width: 260, height: "clamp(320px, calc(100vh - 220px), 480px)" }}
          >
            <div className="flex flex-col items-center gap-5 px-8 text-center">
              <div className="w-14 h-14 border-2 border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C]">
                <Scissors size={24} />
              </div>
              <p
                className="text-xl font-bold text-[#F5E6C8] leading-snug"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Pronto para agendar?
              </p>
              <a
                href="/agendamento"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#C9A84C] text-[#0A0A0A] text-xs font-black tracking-widest uppercase hover:bg-[#E2C06A] active:scale-[0.97] transition-all duration-300"
              >
                Ver horários <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ========= MOBILE: cards empilhados ========= */}
      <div className="md:hidden py-20 px-4">
        <motion.div
          className="text-center mb-10"
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
            className="text-2xl sm:text-3xl font-bold text-[#F5E6C8]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Nossos serviços
          </h2>
        </motion.div>

        <div ref={mobileRef} className="flex flex-col gap-3">
          {items.map((item, idx) => {
            const desc = descontos?.get(item.id);
            const precoOrig = item.preco;
            const precoFinal = desc && precoOrig && !precoOrig.startsWith("A")
              ? precoComDesconto(precoOrig, desc.percentual)
              : null;

            return (
              <div
                key={item.id}
                className="gsap-card relative bg-white/[0.03] backdrop-blur-sm border border-[#C9A84C]/10 p-5 flex flex-col gap-3 active:border-[#C9A84C]/40 transition-all"
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
      </div>
    </section>
  );
}
