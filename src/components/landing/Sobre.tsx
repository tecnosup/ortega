interface SobreProps {
  texto: string;
}

export default function Sobre({ texto }: SobreProps) {
  return (
    <section id="sobre" className="py-28 bg-[#0A0A0A] relative overflow-hidden">
      {/* linha decorativa */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        {/* imagem com bordas douradas */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-[#C9A84C]/30 via-transparent to-[#C9A84C]/10 rounded-sm" />
          <div className="relative w-full h-80 overflow-hidden border border-[#C9A84C]/20">
            <img
              src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80"
              alt="Interior da barbearia Ortega"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 to-transparent" />
          </div>
          {/* canto decorativo */}
          <div className="absolute -bottom-3 -right-3 w-16 h-16 border-r-2 border-b-2 border-[#C9A84C]/40" />
          <div className="absolute -top-3 -left-3 w-16 h-16 border-l-2 border-t-2 border-[#C9A84C]/40" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Nossa história</span>
          </div>
          <h2 className="text-4xl font-bold text-[#F5E6C8] leading-tight">
            Sobre a<br />
            <span className="text-[#C9A84C]">Ortega</span>
          </h2>
          <p className="text-[#F5E6C8]/60 leading-relaxed">{texto}</p>

          {/* stats rápidas */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-[#C9A84C]/15">
            {[
              { num: "500+", label: "Clientes" },
              { num: "5+", label: "Anos" },
              { num: "100%", label: "Satisfação" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-[#C9A84C]">{s.num}</span>
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
