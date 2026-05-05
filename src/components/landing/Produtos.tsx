import { ShoppingBag, Tag } from "lucide-react";
import type { Produto } from "@/lib/admin-produtos";

interface ProdutosProps {
  produtos: Produto[];
}

export default function Produtos({ produtos }: ProdutosProps) {
  if (produtos.length === 0) return null;

  return (
    <section id="produtos" className="py-20 md:py-28 bg-[#0A0A0A] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Loja</span>
            <span className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >Nossos produtos</h2>
          <p className="text-[#F5E6C8]/40 text-sm mt-3">Produtos selecionados para o seu estilo</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
          {produtos.map((produto) => (
            <div
              key={produto.id}
              className="group bg-[#141414] border border-[#C9A84C]/10 hover:border-[#C9A84C]/40 transition-all duration-500 flex flex-col"
            >
              <div className="aspect-square overflow-hidden bg-[#1a1a1a]">
                {produto.imagem ? (
                  <img
                    src={produto.imagem}
                    alt={produto.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C9A84C]/20">
                    <ShoppingBag size={40} />
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="font-semibold text-[#F5E6C8] text-sm leading-snug">{produto.titulo}</h3>
                {produto.descricao && (
                  <p className="text-xs text-[#F5E6C8]/35 leading-relaxed flex-1">{produto.descricao}</p>
                )}
                {produto.preco && (
                  <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-[#C9A84C]/10">
                    <Tag size={11} className="text-[#C9A84C]" />
                    <span className="text-sm font-bold text-[#C9A84C]">
                      {produto.preco.startsWith("A") ? produto.preco : `R$ ${produto.preco}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
