const depoimentos = [
  { nome: "Cliente A", texto: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit." },
  { nome: "Cliente B", texto: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit." },
  { nome: "Cliente C", texto: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit." },
];

export default function Depoimentos() {
  return (
    <section id="depoimentos" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">O que dizem sobre nós</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {depoimentos.map((d) => (
            <div key={d.nome} className="bg-white border border-gray-200 p-6 flex flex-col gap-4">
              <div className="flex gap-1 text-gray-400 text-sm">★★★★★</div>
              <p className="text-sm text-gray-600 leading-relaxed">"{d.texto}"</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-9 h-9 bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                  {/* avatar */}
                </div>
                <span className="text-sm font-medium text-gray-900">{d.nome}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
