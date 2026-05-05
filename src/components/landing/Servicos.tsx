import { Scissors, Clock, Tag } from "lucide-react";
import type { Item } from "@/lib/admin-items";

interface ServicosProps {
  items: Item[];
}

export default function Servicos({ items }: ServicosProps) {
  const lista = items;

  return (
    <section id="servicos" className="py-20 md:py-28 bg-[#0D0D0D] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">O que fazemos</span>
            <span className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >Nossos serviços</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {lista.map((item, idx) => (
            <div
              key={item.id}
              className="relative group bg-[#141414] border border-[#C9A84C]/10 p-5 sm:p-6 md:p-7 flex flex-col gap-4 hover:border-[#C9A84C]/50 transition-all duration-500"
            >
              <span className="absolute top-4 right-5 text-4xl md:text-5xl font-black text-[#C9A84C]/5 group-hover:text-[#C9A84C]/10 transition-all select-none">
                {String(idx + 1).padStart(2, "0")}
              </span>

              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] group-hover:bg-[#C9A84C]/20 transition-all">
                <Scissors size={20} />
              </div>

              <h3 className="font-semibold text-[#F5E6C8] text-base md:text-lg tracking-wide">{item.titulo}</h3>
              <p className="text-sm text-[#F5E6C8]/40 leading-relaxed flex-1">{item.descricao}</p>

              <div className="flex items-center gap-4 pt-3 border-t border-[#C9A84C]/10 text-sm">
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

        <div className="text-center mt-10 md:mt-14">
          <a
            href="/agendamento"
            className="inline-flex items-center px-8 py-4 md:px-10 bg-[#C9A84C] text-[#0A0A0A] text-sm font-bold tracking-widest uppercase hover:bg-[#E2C06A] transition-all duration-300"
          >
            Agendar agora
          </a>
        </div>
      </div>
    </section>
  );
}
