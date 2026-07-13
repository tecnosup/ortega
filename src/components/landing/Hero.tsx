"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { IconBrandWhatsappFilled, IconCalendarSearch } from "@tabler/icons-react";

interface HeroDestaque {
  titulo: string;
  preco: string;
  imagem?: string;
  tipo: "servico" | "produto";
}

interface HeroProps {
  titulo: string;
  subtitulo: string;
  whatsappNumber: string;
  imagemFundo?: string;
  imagemRetrato?: string;
  destaque?: HeroDestaque | null;
}

export default function Hero({ titulo, subtitulo, whatsappNumber, imagemFundo, imagemRetrato, destaque }: HeroProps) {
  const words = titulo.split(" ");

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de agendar um horário na Ortega.`
    : "#";

  return (
    <section className="relative min-h-screen-safe flex items-center overflow-hidden bg-[#0A0A0A]">

      {/* fundo */}
      <div className="absolute inset-0">
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
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-12 md:pt-0 md:pb-0 min-h-screen-safe flex flex-col md:flex-row md:items-center">

        {/* coluna texto */}
        <div className="w-full md:w-[55%] flex flex-col gap-6 md:gap-8 md:py-32">

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
              alt="Ortega"
              fill
              className="object-contain drop-shadow-[0_0_16px_rgba(201,168,76,0.6)]"
              priority
            />
          </motion.div>

          {/* título word-by-word */}
          <div>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#F5E6C8] leading-[1.05] tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em] last:mr-0">
                  <motion.span
                    className="inline-block"
                    initial={{ y: "110%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    transition={{ duration: 1, delay: 0.15 + i * 0.1, ease: "easeOut" }}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              className="text-sm sm:text-base text-[#F5E6C8]/50 mt-4 leading-relaxed max-w-sm"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 + words.length * 0.1 }}
            >
              {subtitulo}
            </motion.p>
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
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 sm:px-8 py-4 bg-[#C9A84C] text-[#0A0A0A] text-sm font-black tracking-widest uppercase shadow-[0_0_24px_rgba(201,168,76,0.35)] hover:bg-[#E2C06A] hover:shadow-[0_0_32px_rgba(201,168,76,0.55)] active:scale-[0.97] transition-all duration-300"
              >
                Agendar
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-8 py-4 border-2 border-[#C9A84C] text-[#C9A84C] text-sm font-bold tracking-wider uppercase hover:bg-[#C9A84C] hover:text-[#0A0A0A] active:scale-[0.97] transition-all duration-300"
              >
                <IconBrandWhatsappFilled size={16} />
                WhatsApp
              </a>
            </div>
            <a
              href="/agendamento/status"
              className="group/status inline-flex items-center justify-center sm:justify-start gap-2.5 self-stretch sm:self-start px-4 py-2.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] text-sm text-[#F5E6C8]/80 hover:border-[#C9A84C]/60 hover:bg-[#C9A84C]/10 hover:text-[#F5E6C8] transition-all duration-300"
            >
              <IconCalendarSearch size={16} className="text-[#C9A84C] shrink-0" />
              <span className="tracking-wide">Já agendou? <span className="font-semibold text-[#C9A84C]">Ver meu status</span></span>
              <span className="text-[#C9A84C] transition-transform duration-300 group-hover/status:translate-x-0.5">→</span>
            </a>

            {/* destaque no mobile (no desktop ele fica sobre o retrato) */}
            {destaque && (
              <a href="/agendamento" className="md:hidden mt-1 bg-[#0A0A0A]/80 border border-[#C9A84C]/40 px-4 py-3 flex items-center gap-3">
                {destaque.imagem && (
                  <img src={destaque.imagem} alt={destaque.titulo} className="w-11 h-11 object-cover rounded shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[#C9A84C] text-[9px] tracking-[0.25em] uppercase font-medium">Em destaque</p>
                  <p className="text-[#F5E6C8] text-sm font-semibold truncate">{destaque.titulo}</p>
                  {destaque.preco && <p className="text-[#C9A84C] text-xs font-bold">R$ {destaque.preco}</p>}
                </div>
              </a>
            )}
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

        {/* coluna retrato */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center md:relative">
          <motion.div
            className="relative w-72 lg:w-80 xl:w-96"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
          >
            <div className="absolute -inset-3 border border-[#C9A84C]/20" />
            <div className="absolute -inset-6 border border-[#C9A84C]/8" />
            <div className="relative overflow-hidden aspect-[3/4]">
              <img
                src={imagemRetrato || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=85"}
                alt="Barbeiro Ortega"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/70 via-transparent to-transparent" />
            </div>
            {/* card de destaque (só quando o admin ativa e escolhe uma peça) —
                substitui o selo "Desde 2026" pela peça em destaque. */}
            {destaque ? (
              <a href="/agendamento" className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[88%] bg-[#0A0A0A]/95 border border-[#C9A84C]/40 px-4 py-3 flex items-center gap-3 hover:border-[#C9A84C] transition group/dest">
                {destaque.imagem && (
                  <img src={destaque.imagem} alt={destaque.titulo} className="w-11 h-11 object-cover rounded shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[#C9A84C] text-[9px] tracking-[0.25em] uppercase font-medium">Em destaque</p>
                  <p className="text-[#F5E6C8] text-sm font-semibold truncate">{destaque.titulo}</p>
                  {destaque.preco && <p className="text-[#C9A84C] text-xs font-bold">R$ {destaque.preco}</p>}
                </div>
              </a>
            ) : (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0A0A0A]/90 border border-[#C9A84C]/30 px-5 py-3 text-center whitespace-nowrap">
                <p className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase font-medium">Desde 2026</p>
              </div>
            )}
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
