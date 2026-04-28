import { Scissors, Clock, Tag } from "lucide-react";
import type { Item } from "@/lib/admin-items";

interface ServicosProps {
  items: Item[];
}

const PLACEHOLDER_ITEMS: Item[] = [
  {
    id: "1",
    titulo: "Corte Clássico",
    descricao: "Corte masculino tradicional com acabamento impecável. Inclui lavagem e finalização.",
    imagem: "",
    preco: "55",
    duracao: "45 min",
    status: "published",
    order: 1,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "2",
    titulo: "Barba Completa",
    descricao: "Modelagem e aparagem de barba com navalha, toalha quente e hidratação.",
    imagem: "",
    preco: "45",
    duracao: "35 min",
    status: "published",
    order: 2,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "3",
    titulo: "Combo Corte + Barba",
    descricao: "O pacote completo: corte, barba e hidratação capilar.",
    imagem: "",
    preco: "90",
    duracao: "75 min",
    status: "published",
    order: 3,
    createdAt: 0,
    updatedAt: 0,
  },
];

export default function Servicos({ items }: ServicosProps) {
  const lista = items.length > 0 ? items : PLACEHOLDER_ITEMS;

  return (
    <section id="servicos" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-[#b8944a] text-sm font-medium tracking-widest uppercase">O que fazemos</span>
          <h2 className="text-3xl font-bold text-[#1a1a1a] mt-2">Nossos serviços</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {lista.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 p-6 flex flex-col gap-4 hover:border-[#b8944a] transition"
            >
              <div className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center text-[#b8944a]">
                <Scissors size={20} />
              </div>
              <h3 className="font-semibold text-[#1a1a1a] text-lg">{item.titulo}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">{item.descricao}</p>
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-sm text-gray-500">
                {item.preco && (
                  <span className="flex items-center gap-1 font-semibold text-[#1a1a1a]">
                    <Tag size={14} className="text-[#b8944a]" />
                    {item.preco.startsWith("A") ? item.preco : `R$ ${item.preco}`}
                  </span>
                )}
                {item.duracao && (
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-[#b8944a]" />
                    {item.duracao}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <a
            href="/agendamento"
            className="inline-flex items-center px-8 py-3 bg-[#b8944a] text-white text-sm font-medium hover:bg-[#a07d3a] transition"
          >
            Agendar agora
          </a>
        </div>
      </div>
    </section>
  );
}
