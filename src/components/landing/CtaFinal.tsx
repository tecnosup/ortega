"use client";

import { useEffect, useState } from "react";

export default function CtaFinal() {
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    fetch("/api/publico/settings")
      .then((r) => r.json())
      .then((d) => { if (d.whatsappNumber) setWhatsapp(d.whatsappNumber); });
  }, []);

  return (
    <section className="py-16 md:py-28 bg-[#0D0D0D] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_70%)]" />

      <div className="relative max-w-2xl mx-auto px-6 sm:px-8 text-center flex flex-col gap-6 md:gap-8 items-center">
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#F5E6C8] leading-snug">
          Pronto para uma nova{" "}
          <span className="text-[#C9A84C]">versão de você?</span>
        </h2>

        <p className="text-sm sm:text-base text-[#F5E6C8]/50 leading-relaxed max-w-sm">
          Agende seu horário e experimente o cuidado premium que você merece.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto justify-center">
          <a
            href="/agendamento"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#C9A84C] text-[#0A0A0A] text-sm font-bold tracking-widest uppercase active:scale-[0.97] transition-all duration-300"
          >
            Agendar horário
          </a>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de agendar um horário na Ortega Barber.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 border border-[#C9A84C]/40 text-[#C9A84C] text-sm tracking-wider uppercase active:scale-[0.97] transition-all duration-300"
            >
              WhatsApp
            </a>
          )}
        </div>

        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />
      </div>
    </section>
  );
}
