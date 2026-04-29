const depoimentos = [
  {
    nome: "Ricardo Alves",
    texto: "Melhor barbearia da região! O Igor tem uma habilidade incrível com a navalha. Saio sempre renovado e bem tratado.",
    estrelas: 5,
  },
  {
    nome: "Bruno Carvalho",
    texto: "Ambiente top, atendimento impecável. O combo corte + barba é simplesmente perfeito. Não troco por nada.",
    estrelas: 5,
  },
  {
    nome: "Marcos Souza",
    texto: "Fui pela primeira vez indicado por um amigo e virei cliente fiel. A atenção aos detalhes faz toda a diferença.",
    estrelas: 5,
  },
];

export default function Depoimentos() {
  return (
    <section id="depoimentos" className="py-28 bg-[#0A0A0A] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      {/* fundo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(201,168,76,0.04)_0%,transparent_70%)]" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Clientes</span>
            <span className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2 className="text-4xl font-bold text-[#F5E6C8]">O que dizem sobre nós</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {depoimentos.map((d) => (
            <div
              key={d.nome}
              className="relative bg-[#141414] border border-[#C9A84C]/10 p-7 flex flex-col gap-5 hover:border-[#C9A84C]/30 transition-all duration-400"
            >
              {/* aspas decorativas */}
              <span className="absolute top-4 right-6 text-6xl leading-none text-[#C9A84C]/10 font-serif select-none">"</span>

              <div className="flex gap-0.5 text-[#C9A84C] text-sm">
                {"★".repeat(d.estrelas)}
              </div>

              <p className="text-sm text-[#F5E6C8]/55 leading-relaxed italic flex-1">
                "{d.texto}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-[#C9A84C]/10">
                <div className="w-9 h-9 bg-[#C9A84C] flex items-center justify-center text-[#0A0A0A] text-xs font-bold">
                  {d.nome.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-[#F5E6C8]">{d.nome}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
