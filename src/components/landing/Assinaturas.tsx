"use client";

import { useState } from "react";
import { Check, Crown, Scissors, Zap } from "lucide-react";
import { PLANOS_PUBLICOS } from "@/lib/stripe-tipos";

const PLANO_CONFIG = {
  basico:  { icone: Scissors, beneficiosExtra: ["Agendamento prioritário", "Sem fila de espera"] },
  mensal:  { icone: Zap,      beneficiosExtra: ["Agendamento prioritário", "Sem fila de espera", "Produto grátis no aniversário"] },
  premium: { icone: Crown,    beneficiosExtra: ["Agendamento prioritário", "Sem fila de espera", "Produto grátis no aniversário", "Atendimento VIP exclusivo"] },
};

export default function Assinaturas() {
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <section id="assinaturas" className="py-20 md:py-28 bg-[#080808] relative overflow-hidden">
      {/* linha separadora topo */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      {/* glow de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C9A84C]/3 blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

        {/* cabeçalho */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Clube Ortega</span>
            <span className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Sempre no estilo.<br className="sm:hidden" />{" "}
            <span className="text-[#C9A84C]">Todo mês.</span>
          </h2>
          <p className="text-[#F5E6C8]/40 text-sm mt-3 max-w-md mx-auto">
            Assine um plano e garanta seus cortes com preço fixo, sem pagar na hora. Cancele quando quiser.
          </p>
        </div>

        {/* planos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {PLANOS_PUBLICOS.map((plano) => {
            const cfg = PLANO_CONFIG[plano.id as keyof typeof PLANO_CONFIG];
            const Icone = cfg.icone;
            const destaque = plano.id === "mensal";
            const isHovered = hoverId === plano.id;

            return (
              <div
                key={plano.id}
                onMouseEnter={() => setHoverId(plano.id)}
                onMouseLeave={() => setHoverId(null)}
                className={`relative flex flex-col gap-6 p-6 md:p-7 border transition-all duration-500 ${
                  destaque
                    ? "border-[#C9A84C]/60 bg-[#C9A84C]/5"
                    : isHovered
                    ? "border-[#C9A84C]/30 bg-[#141414]"
                    : "border-[#C9A84C]/10 bg-[#111]"
                }`}
              >
                {/* badge mais popular */}
                {destaque && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-black px-4 py-1 tracking-widest uppercase">
                      Mais popular
                    </span>
                  </div>
                )}

                {/* canto decorativo dourado no plano destaque */}
                {destaque && (
                  <>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C9A84C]/60" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C9A84C]/60" />
                  </>
                )}

                {/* ícone + nome */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center border transition-all duration-500 shrink-0 ${
                    destaque || isHovered
                      ? "bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]"
                      : "bg-[#C9A84C]/5 border-[#C9A84C]/15 text-[#C9A84C]/60"
                  }`}>
                    <Icone size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-[#F5E6C8] text-base tracking-wide">{plano.nome}</p>
                    <p className="text-xs text-[#F5E6C8]/40 mt-0.5">{plano.descricao}</p>
                  </div>
                </div>

                {/* preço */}
                <div className="flex items-end gap-1 border-b border-[#C9A84C]/10 pb-5">
                  <span
                    className="text-4xl font-black text-[#C9A84C] leading-none"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {plano.precoFormatado}
                  </span>
                  <span className="text-[#F5E6C8]/30 text-sm mb-0.5">/mês</span>
                </div>

                {/* benefícios */}
                <ul className="flex flex-col gap-2.5 flex-1">
                  <li className="flex items-center gap-2.5 text-sm text-[#F5E6C8]/70">
                    <Check size={14} className="text-[#C9A84C] shrink-0" />
                    {plano.cortes} corte{plano.cortes > 1 ? "s" : ""} por mês
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#F5E6C8]/70">
                    <Check size={14} className="text-[#C9A84C] shrink-0" />
                    Desconto automático no agendamento
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#F5E6C8]/70">
                    <Check size={14} className="text-[#C9A84C] shrink-0" />
                    Cancele quando quiser
                  </li>
                  {cfg.beneficiosExtra.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-[#F5E6C8]/70">
                      <Check size={14} className="text-[#C9A84C] shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={`/assinatura?plano=${plano.id}`}
                  className={`w-full py-3.5 text-sm font-black tracking-widest uppercase text-center transition-all duration-300 active:scale-[0.97] ${
                    destaque
                      ? "bg-[#C9A84C] text-[#0A0A0A] shadow-[0_0_24px_rgba(201,168,76,0.35)] hover:bg-[#E2C06A] hover:shadow-[0_0_36px_rgba(201,168,76,0.55)]"
                      : "border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/60"
                  }`}
                >
                  Assinar agora
                </a>
              </div>
            );
          })}
        </div>

        {/* rodapé da seção */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-xs text-[#F5E6C8]/25 flex items-center gap-2">
            <span className="w-4 h-px bg-[#C9A84C]/30" />
            Pagamento seguro via Stripe · Cobrado mensalmente
            <span className="w-4 h-px bg-[#C9A84C]/30" />
          </p>
          <a
            href="/assinatura/minha"
            className="text-sm text-[#F5E6C8]/35 hover:text-[#C9A84C] transition-colors"
          >
            Já sou assinante → ver minha assinatura
          </a>
        </div>
      </div>
    </section>
  );
}
