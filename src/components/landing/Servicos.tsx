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
    <section id="servicos" className="py-28 bg-[#0D0D0D] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">O que fazemos</span>
            <span className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2 className="text-4xl font-bold text-[#F5E6C8]">Nossos serviços</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {lista.map((item, idx) => (
            <div
              key={item.id}
              className="relative group bg-[#141414] border border-[#C9A84C]/10 p-7 flex flex-col gap-5 hover:border-[#C9A84C]/50 transition-all duration-500 hover:bg-[#141414]"
            >
              {/* número decorativo */}
              <span className="absolute top-5 right-6 text-5xl font-black text-[#C9A84C]/5 group-hover:text-[#C9A84C]/10 transition-all select-none">
                {String(idx + 1).padStart(2, "0")}
              </span>

              <div className="w-12 h-12 bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] group-hover:bg-[#C9A84C]/20 transition-all">
                <Scissors size={22} />
              </div>

              <h3 className="font-semibold text-[#F5E6C8] text-lg tracking-wide">{item.titulo}</h3>
              <p className="text-sm text-[#F5E6C8]/40 leading-relaxed flex-1">{item.descricao}</p>

              <div className="flex items-center gap-5 pt-4 border-t border-[#C9A84C]/10 text-sm">
                {item.preco && (
                  <span className="flex items-center gap-1.5 font-bold text-[#C9A84C]">
                    <Tag size={13} />
                    {item.preco.startsWith("A") ? item.preco : `R$ ${item.preco}`}
                  </span>
                )}
                {item.duracao && (
                  <span className="flex items-center gap-1.5 text-[#F5E6C8]/30">
                    <Clock size={13} />
                    {item.duracao}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <a
            href="/agendamento"
            className="inline-flex items-center px-10 py-4 bg-[#C9A84C] text-[#0A0A0A] text-sm font-bold tracking-widest uppercase hover:bg-[#E2C06A] transition-all duration-300"
          >
            Agendar agora
          </a>
        </div>
      </div>
    </section>
  );
}
