"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { formatarHorarioFuncionamento, type GradeConfig } from "@/lib/grade";
import { IconBrandWhatsappFilled, IconBrandInstagram } from "@tabler/icons-react";

const year = new Date().getFullYear();

interface FooterSettings {
  whatsappNumber?: string;
  instagramUrl?: string;
  enderecoTexto?: string;
  grade?: GradeConfig;
}

export default function Footer() {
  const [cfg, setCfg] = useState<FooterSettings>({});

  useEffect(() => {
    fetch("/api/publico/settings")
      .then((r) => r.json())
      .then((d) => setCfg(d ?? {}))
      .catch(() => {});
  }, []);

  const { whatsappNumber, instagramUrl, enderecoTexto, grade } = cfg;
  const horarioFuncionamento = grade ? formatarHorarioFuncionamento(grade) : "";

  return (
    <footer className="bg-[#080808] border-t border-[#C9A84C]/15 pt-12 md:pt-16 pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">

        {/* mobile: marca full-width + 2 colunas; desktop: 3 colunas alinhadas */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:gap-8 md:grid-cols-[1.4fr_1fr_1fr]">

          {/* marca + endereço + horário — ocupa a linha toda no mobile */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo-ortega.png" alt="Ortega" width={36} height={36} className="object-contain opacity-90" />
              <span className="text-[#C9A84C] font-bold tracking-[0.25em] uppercase text-sm">Ortega</span>
            </div>
            {(enderecoTexto || horarioFuncionamento) && (
              <div className="flex flex-col gap-1.5 text-xs leading-relaxed text-[#F5E6C8]/45 max-w-xs">
                {enderecoTexto && <span>{enderecoTexto}</span>}
                {horarioFuncionamento && <span>{horarioFuncionamento}</span>}
              </div>
            )}
          </div>

          {/* navegação */}
          <nav className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C9A84C]/70">Navegação</span>
            <a href="/privacidade" className="text-sm text-[#F5E6C8]/50 hover:text-[#C9A84C] transition-colors w-fit">Privacidade</a>
            <a href="/termos" className="text-sm text-[#F5E6C8]/50 hover:text-[#C9A84C] transition-colors w-fit">Termos</a>
            <a href="/contato" className="text-sm text-[#F5E6C8]/50 hover:text-[#C9A84C] transition-colors w-fit">Contato</a>
          </nav>

          {/* contato — botões chamativos com ícone */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C9A84C]/70">Fale com a gente</span>
            <div className="flex flex-col gap-2.5">
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#dcbb5c] transition-colors w-full md:w-fit"
                >
                  <IconBrandWhatsappFilled size={16} />
                  WhatsApp
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full border border-[#C9A84C]/30 px-4 py-2.5 text-sm font-medium text-[#F5E6C8]/80 hover:border-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors w-full md:w-fit"
                >
                  <IconBrandInstagram size={16} />
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        {/* barra inferior */}
        <div className="mt-10 pt-6 border-t border-[#C9A84C]/10 text-center md:text-left text-xs text-[#F5E6C8]/25 tracking-wide">
          <span>© {year} Ortega Barber. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
