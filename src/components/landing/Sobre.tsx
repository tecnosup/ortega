interface SobreProps {
  texto: string;
}

export default function Sobre({ texto }: SobreProps) {
  return (
    <section id="sobre" className="py-20 md:py-28 bg-[#0A0A0A] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* imagem */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-[#C9A84C]/30 via-transparent to-[#C9A84C]/10 rounded-sm" />
          <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden border border-[#C9A84C]/20">
            <img
              src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80"
              alt="Interior da barbearia Ortega"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 to-transparent" />
          </div>
          <div className="absolute -bottom-3 -right-3 w-12 h-12 md:w-16 md:h-16 border-r-2 border-b-2 border-[#C9A84C]/40" />
          <div className="absolute -top-3 -left-3 w-12 h-12 md:w-16 md:h-16 border-l-2 border-t-2 border-[#C9A84C]/40" />
        </div>

        <div className="flex flex-col gap-5 md:gap-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Nossa história</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8] leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Sobre a<br />
            <span className="text-[#C9A84C]">Ortega</span>
          </h2>
          <p className="text-sm sm:text-base text-[#F5E6C8]/60 leading-relaxed">{texto}</p>

          {/* stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 py-4 border-t border-[#C9A84C]/15">
            {[
              { num: "500+", label: "Clientes" },
              { num: "5+", label: "Anos" },
              { num: "100%", label: "Satisfação" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#C9A84C]">{s.num}</span>
                <span className="text-xs text-[#F5E6C8]/40 tracking-wider uppercase">{s.label}</span>
              </div>
            ))}
          </div>

          <a
            href="#servicos"
            className="self-start inline-flex items-center px-6 py-3 border border-[#C9A84C] text-[#C9A84C] text-sm font-medium tracking-wider uppercase hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-300"
          >
            Ver serviços
          </a>
        </div>
      </div>
    </section>
  );
}
