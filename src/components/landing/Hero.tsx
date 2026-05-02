"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-24 h-24 opacity-30 animate-pulse">
        <Image src="/logo-ortega.png" alt="" width={96} height={96} className="object-contain" />
      </div>
    </div>
  ),
});

interface HeroProps {
  titulo: string;
  subtitulo: string;
  whatsappNumber: string;
}

export default function Hero({ titulo, subtitulo, whatsappNumber }: HeroProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de agendar um horário na Ortega Barber.`
    : "#";

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0A0A0A]">

      {/* fundo — grade dourada sutil */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_50%,rgba(201,168,76,0.08)_0%,transparent_70%)]" />
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#C9A84C]/30 to-transparent" />

      {/* layout mobile: coluna única com 3D embaixo / desktop: 30% texto + 70% 3D */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-20 md:pt-0 pb-10 md:pb-0 flex flex-col md:grid md:grid-cols-[3fr_7fr] md:gap-0 md:items-center md:min-h-screen">

        {/* ── TEXTO ── */}
        <div className="flex flex-col gap-5 md:gap-7 md:pr-8 md:py-32">

          <div className="flex items-center gap-2">
            <span className="inline-block w-6 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Barbearia Premium</span>
          </div>

          {/* logo brasão — menor no mobile */}
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36">
            <div className="absolute inset-0 bg-[#C9A84C]/10 rounded-full blur-2xl" />
            <Image
              src="/logo-ortega.png"
              alt="Ortega Barber"
              fill
              className="object-contain drop-shadow-[0_0_20px_rgba(201,168,76,0.5)]"
              priority
            />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8] leading-tight tracking-wide">
              {titulo}
            </h1>
            <p className="text-sm text-[#F5E6C8]/50 mt-3 leading-relaxed">
              {subtitulo}
            </p>
          </div>

          {/* CTAs — lado a lado no mobile e desktop */}
          <div className="flex flex-row gap-3">
            <a
              href="/agendamento"
              className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-[#C9A84C] text-[#0A0A0A] text-sm font-semibold tracking-wider uppercase hover:bg-[#E2C06A] transition-all duration-300"
            >
              Agendar
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-[#C9A84C]/40 text-[#C9A84C] text-sm tracking-wide hover:border-[#C9A84C] hover:bg-[#C9A84C]/05 transition-all duration-300"
            >
              WhatsApp
            </a>
          </div>

          {/* info rápida */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#C9A84C]/10">
            <div className="flex items-center gap-2 text-xs text-[#F5E6C8]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0" />
              R. Cap. Neco, 300 — Vila Ana Rosa Novaes
            </div>
            <div className="flex items-center gap-2 text-xs text-[#F5E6C8]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0" />
              Seg – Sáb · 09h às 19h
            </div>
          </div>
        </div>

        {/* ── 3D — menor no mobile, full no desktop ── */}
        <div className="relative h-[45vw] min-h-[240px] max-h-[380px] md:max-h-none md:h-screen flex items-center justify-center mt-2 md:mt-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,rgba(201,168,76,0.12)_0%,transparent_70%)]" />
          {mounted && <Hero3D />}
        </div>
      </div>

      {/* scroll indicator — só desktop */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-40">
        <span className="text-[10px] text-[#C9A84C] tracking-[0.3em] uppercase">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#C9A84C] to-transparent" />
      </div>
    </section>
  );
}
