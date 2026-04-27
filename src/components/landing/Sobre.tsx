interface SobreProps {
  texto: string;
}

export default function Sobre({ texto }: SobreProps) {
  return (
    <section id="sobre" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="w-full h-72 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
          {/* insira imagem aqui */}
          [imagem]
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold text-gray-900">Sobre nós</h2>
          <p className="text-gray-600 leading-relaxed">{texto}</p>
        </div>
      </div>
    </section>
  );
}
