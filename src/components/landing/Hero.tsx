interface HeroProps {
  titulo: string;
  subtitulo: string;
  whatsappNumber: string;
}

export default function Hero({ titulo, subtitulo, whatsappNumber }: HeroProps) {
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de agendar um horário na Ortega Barber.`
    : "#";

  return (
    <section className="min-h-[92vh] pt-16 flex items-center bg-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center w-full">
        <div className="flex flex-col gap-6">
          <span className="text-[#b8944a] text-sm font-medium tracking-widest uppercase">
            Barbearia Premium
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            {titulo}
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">{subtitulo}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/agendamento"
              className="inline-flex items-center px-6 py-3 bg-[#b8944a] text-white text-sm font-medium hover:bg-[#a07d3a] transition"
            >
              Agendar horário
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-[#b8944a] text-[#b8944a] text-sm hover:bg-[#b8944a] hover:text-white transition"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="w-full h-80 md:h-[500px] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80"
            alt="Barbeiro trabalhando"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
