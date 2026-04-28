const depoimentos = [
  {
    nome: "Ricardo Alves",
    texto: "Melhor barbearia da região! O Felipe tem uma habilidade incrível com a navalha. Saio sempre renovado e bem tratado.",
  },
  {
    nome: "Bruno Carvalho",
    texto: "Ambiente top, atendimento impecável. O combo corte + barba é simplesmente perfeito. Não troco por nada.",
  },
  {
    nome: "Marcos Souza",
    texto: "Fui pela primeira vez indicado por um amigo e virei cliente fiel. A atenção aos detalhes faz toda a diferença.",
  },
];

export default function Depoimentos() {
  return (
    <section id="depoimentos" className="py-24 bg-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-[#b8944a] text-sm font-medium tracking-widest uppercase">Clientes</span>
          <h2 className="text-3xl font-bold text-white mt-2">O que dizem sobre nós</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {depoimentos.map((d) => (
            <div key={d.nome} className="bg-[#2d2d2d] border border-[#3d3d3d] p-6 flex flex-col gap-4">
              <div className="flex gap-0.5 text-[#b8944a]">★★★★★</div>
              <p className="text-sm text-gray-300 leading-relaxed">"{d.texto}"</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-9 h-9 rounded-full bg-[#b8944a] flex items-center justify-center text-white text-xs font-bold">
                  {d.nome.charAt(0)}
                </div>
                <span className="text-sm font-medium text-white">{d.nome}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
