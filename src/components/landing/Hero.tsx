interface HeroProps {
  titulo: string;
  subtitulo: string;
  whatsappNumber: string;
}

export default function Hero({ titulo, subtitulo, whatsappNumber }: HeroProps) {
  const href = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#";

  return (
    <section className="min-h-[92vh] pt-16 flex items-center bg-white">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center w-full">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            {titulo}
          </h1>
          <p className="text-lg text-gray-500">{subtitulo}</p>
          <div className="flex gap-3">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white text-sm hover:bg-gray-700 transition"
            >
              Chame no WhatsApp
            </a>
            <a
              href="/contato"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition"
            >
              Saiba mais
            </a>
          </div>
        </div>

        <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
          {/* insira imagem aqui */}
          [imagem]
        </div>
      </div>
    </section>
  );
}
