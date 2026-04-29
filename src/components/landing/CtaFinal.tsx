export default function CtaFinal() {
  return (
    <section className="py-28 bg-[#0D0D0D] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

      {/* fundo com borda decorativa interna */}
      <div className="absolute inset-8 border border-[#C9A84C]/08 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(201,168,76,0.06)_0%,transparent_70%)]" />

      <div className="relative max-w-2xl mx-auto px-6 text-center flex flex-col gap-8 items-center">
        {/* brasão mini */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

        <h2 className="text-4xl md:text-5xl font-bold text-[#F5E6C8] leading-tight">
          Pronto para uma nova<br />
          <span className="text-[#C9A84C]">versão de você?</span>
        </h2>

        <p className="text-[#F5E6C8]/50 leading-relaxed max-w-md">
          Agende seu horário agora e experimente o cuidado premium que você merece. Na Ortega, cada detalhe importa.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="/agendamento"
            className="inline-flex items-center px-10 py-4 bg-[#C9A84C] text-[#0A0A0A] text-sm font-bold tracking-widest uppercase hover:bg-[#E2C06A] transition-all duration-300"
          >
            Agendar horário
          </a>
          <a
            href="https://wa.me/5512925855538?text=Olá! Gostaria de agendar um horário na Ortega Barber."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-10 py-4 border border-[#C9A84C]/40 text-[#C9A84C] text-sm tracking-wider uppercase hover:border-[#C9A84C] hover:bg-[#C9A84C]/05 transition-all duration-300"
          >
            WhatsApp
          </a>
        </div>

        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />
      </div>
    </section>
  );
}
