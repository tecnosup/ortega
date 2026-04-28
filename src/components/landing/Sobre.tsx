interface SobreProps {
  texto: string;
}

export default function Sobre({ texto }: SobreProps) {
  return (
    <section id="sobre" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="w-full h-80 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80"
            alt="Interior da barbearia Ortega"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-[#b8944a] text-sm font-medium tracking-widest uppercase">Nossa história</span>
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Sobre a Ortega</h2>
          <p className="text-gray-600 leading-relaxed">{texto}</p>
          <a
            href="#servicos"
            className="self-start mt-2 inline-flex items-center px-5 py-2.5 bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#2d2d2d] transition"
          >
            Ver serviços
          </a>
        </div>
      </div>
    </section>
  );
}
