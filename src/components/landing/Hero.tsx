"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  titulo: string;
  subtitulo: string;
  whatsappNumber: string;
  imagemFundo?: string;
  imagemRetrato?: string;
}

export default function Hero({ titulo, subtitulo, whatsappNumber, imagemFundo, imagemRetrato }: HeroProps) {
  const sectionRef    = useRef<HTMLElement>(null);
  const bgRef         = useRef<HTMLDivElement>(null);
  const retratoRef    = useRef<HTMLDivElement>(null);
  const textColRef    = useRef<HTMLDivElement>(null);
  const titleRef      = useRef<HTMLHeadingElement>(null);
  const subtitleRef   = useRef<HTMLParagraphElement>(null);

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de agendar um horário na Ortega Barber.`
    : "#";

  /* ---------- entrada do título word-by-word ---------- */
  useEffect(() => {
    if (!titleRef.current || !subtitleRef.current) return;

    const words = titulo.split(" ");
    titleRef.current.innerHTML = words
      .map((w) => `<span class="gsap-word" style="display:inline-block;overflow:hidden;vertical-align:bottom;"><span style="display:inline-block;">${w}</span></span>`)
      .join(" ");

    const spans = titleRef.current.querySelectorAll(".gsap-word > span");
    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo(spans,
      { y: "110%", opacity: 0 },
      { y: "0%", opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" }
    ).fromTo(subtitleRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=0.5"
    );

    return () => { tl.kill(); };
  }, [titulo]);

  /* ---------- parallax no scroll ---------- */
  useEffect(() => {
    if (!sectionRef.current || !bgRef.current || !retratoRef.current || !textColRef.current) return;

    const ctx = gsap.context(() => {
      /* camada 1 — fundo: move mais devagar (efeito de profundidade) */
      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* camada 2 — retrato: velocidade média */
      gsap.to(retratoRef.current, {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      /* camada 3 — texto: sobe mais rápido, fade out sutil */
      gsap.to(textColRef.current, {
        yPercent: -18,
        opacity: 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "60% top",
          scrub: 0.8,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative md:min-h-screen flex items-center overflow-hidden bg-[#0A0A0A]">

      {/* camada 1 — foto de fundo (parallax lento) */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <img
          src={imagemFundo || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=85"}
          alt=""
          className="w-full h-full object-cover object-center opacity-30 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-[#0A0A0A]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/60" />
      </div>

      {/* grain texture */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px",
        }}
      />

      {/* linha dourada vertical esquerda */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#C9A84C]/40 to-transparent" />

      {/* conteúdo */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-12 md:pt-0 md:pb-0 md:min-h-screen flex flex-col md:flex-row md:items-center">

        {/* camada 3 — coluna texto (parallax rápido) */}
        <div ref={textColRef} className="will-change-transform w-full md:w-[55%] flex flex-col gap-6 md:gap-8 md:py-32">

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="inline-block w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.35em] uppercase">Barbearia Premium</span>
          </motion.div>

          <motion.div
            className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-[#C9A84C]/15 rounded-full blur-xl" />
            <Image
              src="/logo-ortega.png"
              alt="Ortega Barber"
              fill
              className="object-contain drop-shadow-[0_0_16px_rgba(201,168,76,0.6)]"
              priority
            />
          </motion.div>

          {/* título animado pelo GSAP */}
          <div>
            <h1
              ref={titleRef}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#F5E6C8] leading-[1.05] tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {titulo}
            </h1>
            <p ref={subtitleRef} className="text-sm sm:text-base text-[#F5E6C8]/50 mt-4 leading-relaxed max-w-sm" style={{ opacity: 0 }}>
              {subtitulo}
            </p>
          </div>

          <motion.div
            className="flex items-center gap-3 w-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span className="flex-1 h-px bg-[#C9A84C]/40" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#C9A84C] shrink-0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
            <span className="flex-1 h-px bg-[#C9A84C]/40" />
          </motion.div>

          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <div className="flex flex-row gap-3">
              <a
                href="/agendamento"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 py-4 bg-[#C9A84C] text-[#0A0A0A] text-sm font-black tracking-widest uppercase shadow-[0_0_24px_rgba(201,168,76,0.35)] hover:bg-[#E2C06A] hover:shadow-[0_0_32px_rgba(201,168,76,0.55)] active:scale-[0.97] transition-all duration-300"
              >
                Agendar
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 py-4 border-2 border-[#C9A84C] text-[#C9A84C] text-sm font-bold tracking-wider uppercase hover:bg-[#C9A84C] hover:text-[#0A0A0A] active:scale-[0.97] transition-all duration-300"
              >
                WhatsApp
              </a>
            </div>
            <a
              href="/agendamento/status"
              className="text-xs text-[#F5E6C8]/40 hover:text-[#C9A84C]/70 transition text-center sm:text-left tracking-wide"
            >
              Ver status do meu agendamento →
            </a>
          </motion.div>

          <motion.div
            className="flex flex-col gap-2 pt-2 border-t border-[#C9A84C]/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex items-center gap-2.5 text-xs text-[#F5E6C8]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/60 shrink-0" />
              R. Cap. Neco, 300 — Vila Ana Rosa Novaes
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#F5E6C8]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/70 shrink-0" />
              Seg – Sáb · 09h às 19h
            </div>
          </motion.div>
        </div>

        {/* camada 2 — retrato (parallax médio) */}
        <div ref={retratoRef} className="will-change-transform hidden md:flex md:flex-1 md:items-center md:justify-center md:relative">
          <motion.div
            className="relative w-72 lg:w-80 xl:w-96"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
          >
            <div className="absolute -inset-3 border border-[#C9A84C]/20" />
            <div className="absolute -inset-6 border border-[#C9A84C]/08" />
            <div className="relative overflow-hidden aspect-[3/4]">
              <img
                src={imagemRetrato || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=85"}
                alt="Barbeiro Ortega"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/70 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0A0A0A]/90 border border-[#C9A84C]/30 px-5 py-3 text-center whitespace-nowrap">
              <p className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase font-medium">Desde 2018</p>
            </div>
            <div className="absolute -bottom-3 -right-3 w-12 h-12 border-r-2 border-b-2 border-[#C9A84C]/50" />
            <div className="absolute -top-3 -left-3 w-12 h-12 border-l-2 border-t-2 border-[#C9A84C]/50" />
          </motion.div>
        </div>
      </div>

      {/* scroll indicator */}
      <motion.div
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        <span className="text-[10px] text-[#C9A84C] tracking-[0.3em] uppercase">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#C9A84C] to-transparent" />
      </motion.div>
    </section>
  );
}
