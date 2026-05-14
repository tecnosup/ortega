"use client";

import { useState } from "react";
import { ShoppingBag, Tag, X } from "lucide-react";
import type { Produto } from "@/lib/admin-produtos";
import type { Desconto } from "@/lib/admin-descontos";
import type { Categoria } from "@/lib/admin-categorias";

interface ProdutosProps {
  produtos: Produto[];
  descontos?: Map<string, Desconto>;
  whatsappNumber?: string;
  categorias?: Categoria[];
}

function precoComDesconto(preco: string, pct: number) {
  const num = parseFloat(preco.replace(",", "."));
  if (isNaN(num)) return null;
  return (num * (1 - pct / 100)).toFixed(2).replace(".", ",");
}

function ProdutoModal({
  produto,
  precoFinal,
  precoOriginal,
  whatsappNumber,
  onClose,
}: {
  produto: Produto;
  precoFinal: string | null;
  precoOriginal: string;
  whatsappNumber?: string;
  onClose: () => void;
}) {
  const precoExibido = precoFinal
    ? `R$ ${precoFinal}`
    : precoOriginal.startsWith("A")
    ? precoOriginal
    : `R$ ${precoOriginal}`;

  const mensagemWpp = encodeURIComponent(
    `Olá! Tenho interesse no produto: ${produto.titulo} - ${precoExibido}`
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[#111] border border-[#C9A84C]/20 rounded-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#2d2d2d] text-gray-400 hover:text-[#F5E6C8] transition"
        >
          <X size={14} />
        </button>

        {produto.imagem ? (
          <img
            src={produto.imagem}
            alt={produto.titulo}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-[#1a1a1a] flex items-center justify-center">
            <ShoppingBag size={48} className="text-[#C9A84C]/20" />
          </div>
        )}

        <div className="p-5 flex flex-col gap-3">
          <h3
            className="text-lg font-bold text-[#F5E6C8]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {produto.titulo}
          </h3>

          {produto.descricao && (
            <p className="text-sm text-[#F5E6C8]/50 leading-relaxed">{produto.descricao}</p>
          )}

          {precoOriginal && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#C9A84C]/10">
              <Tag size={13} className="text-[#C9A84C]" />
              {precoFinal ? (
                <span className="flex items-center gap-2">
                  <span className="text-sm line-through text-[#F5E6C8]/25">R$ {precoOriginal}</span>
                  <span className="text-lg font-bold text-[#C9A84C]">R$ {precoFinal}</span>
                </span>
              ) : (
                <span className="text-lg font-bold text-[#C9A84C]">{precoExibido}</span>
              )}
            </div>
          )}

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}?text=${mensagemWpp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 w-full py-3 bg-[#C9A84C] text-[#0A0A0A] text-sm font-black tracking-widest uppercase text-center rounded hover:bg-[#E2C06A] transition"
            >
              Comprar via WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Produtos({ produtos, descontos, whatsappNumber, categorias = [] }: ProdutosProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [activeCategoria, setActiveCategoria] = useState<string>("todos");
  const [modalProduto, setModalProduto] = useState<Produto | null>(null);

  if (produtos.length === 0) return null;

  const categoriasComProdutos = categorias.filter((cat) =>
    produtos.some((p) => p.categoriaId === cat.id)
  );

  const mostrarAbas = categoriasComProdutos.length > 0;

  const produtosFiltrados = activeCategoria === "todos"
    ? produtos
    : produtos.filter((p) => p.categoriaId === activeCategoria);

  const getPrecos = (produto: Produto) => {
    const desconto = descontos?.get(produto.id);
    const precoOriginal = produto.preco;
    const precoFinal = desconto && precoOriginal && !precoOriginal.startsWith("A")
      ? precoComDesconto(precoOriginal, desconto.percentual)
      : null;
    return { desconto, precoOriginal, precoFinal };
  };

  return (
    <section id="produtos" className="py-20 md:py-28 bg-[#0A0A0A] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      {modalProduto && (() => {
        const { precoFinal, precoOriginal } = getPrecos(modalProduto);
        return (
          <ProdutoModal
            produto={modalProduto}
            precoFinal={precoFinal}
            precoOriginal={precoOriginal}
            whatsappNumber={whatsappNumber}
            onClose={() => setModalProduto(null)}
          />
        );
      })()}

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* cabeçalho */}
        <div className="text-center mb-10 md:mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Loja</span>
            <span className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >Nossos produtos</h2>
          <p className="text-[#F5E6C8]/35 text-sm mt-3">Produtos selecionados para o seu estilo</p>
        </div>

        {/* filtro de categorias */}
        {mostrarAbas && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            <button
              onClick={() => setActiveCategoria("todos")}
              className={`px-4 py-1.5 text-sm border transition ${
                activeCategoria === "todos"
                  ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10"
                  : "border-[#C9A84C]/20 text-[#F5E6C8]/50 hover:border-[#C9A84C]/50 hover:text-[#F5E6C8]/80"
              }`}
            >
              Todos
            </button>
            {categoriasComProdutos.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoria(cat.id)}
                className={`px-4 py-1.5 text-sm border transition ${
                  activeCategoria === cat.id
                    ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10"
                    : "border-[#C9A84C]/20 text-[#F5E6C8]/50 hover:border-[#C9A84C]/50 hover:text-[#F5E6C8]/80"
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        )}

        {/* mobile: scroll horizontal tipo prateleira */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
            {produtosFiltrados.map((produto) => {
              const { desconto, precoOriginal, precoFinal } = getPrecos(produto);

              return (
                <button
                  key={produto.id}
                  onClick={() => setModalProduto(produto)}
                  className="relative flex flex-col bg-[#141414] border border-[#C9A84C]/10 overflow-hidden text-left"
                  style={{ width: 180 }}
                >
                  {desconto && (
                    <span className="absolute top-2 left-2 z-10 bg-[#C9A84C] text-[#0A0A0A] text-[9px] font-black px-1.5 py-0.5 tracking-wider uppercase">
                      -{desconto.percentual}%
                    </span>
                  )}

                  <div className="relative overflow-hidden bg-[#1a1a1a]" style={{ aspectRatio: "3/4" }}>
                    {produto.imagem ? (
                      <img
                        src={produto.imagem}
                        alt={produto.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#C9A84C]/15">
                        <ShoppingBag size={32} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414] to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="font-semibold text-[#F5E6C8] text-xs leading-tight">{produto.titulo}</p>
                      {precoOriginal && (
                        <p className="text-[#C9A84C] text-xs font-bold mt-0.5">
                          {precoFinal ? `R$ ${precoFinal}` : precoOriginal.startsWith("A") ? precoOriginal : `R$ ${precoOriginal}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="py-2.5 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-black tracking-widest uppercase text-center">
                    Ver produto
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* desktop: grid com hover animado */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5">
          {produtosFiltrados.map((produto) => {
            const { desconto, precoOriginal, precoFinal } = getPrecos(produto);
            const isHovered = hoverId === produto.id;

            return (
              <div
                key={produto.id}
                className="relative flex flex-col bg-[#141414] border border-[#C9A84C]/10 overflow-hidden transition-all duration-500 group cursor-pointer"
                onMouseEnter={() => setHoverId(produto.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => setModalProduto(produto)}
                style={{
                  borderColor: isHovered ? "rgba(201,168,76,0.5)" : undefined,
                  transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                }}
              >
                {desconto && (
                  <span className="absolute top-2 left-2 z-10 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                    -{desconto.percentual}%
                  </span>
                )}

                <div className="relative overflow-hidden bg-[#1a1a1a]" style={{ aspectRatio: "3/4" }}>
                  {produto.imagem ? (
                    <img
                      src={produto.imagem}
                      alt={produto.titulo}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#C9A84C]/15">
                      <ShoppingBag size={40} />
                    </div>
                  )}

                  <div className={`absolute inset-0 bg-[#0A0A0A]/60 flex items-end transition-opacity duration-400 ${isHovered ? "opacity-100" : "opacity-0"}`}>
                    <div
                      className="w-full py-3.5 bg-[#C9A84C] text-[#0A0A0A] text-xs font-black tracking-widest uppercase text-center shadow-[0_0_24px_rgba(201,168,76,0.5)]"
                      style={{
                        transform: isHovered ? "translateY(0)" : "translateY(100%)",
                        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                      }}
                    >
                      Ver produto
                    </div>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-1.5">
                  <h3 className="font-semibold text-[#F5E6C8] text-sm leading-snug">{produto.titulo}</h3>
                  {produto.descricao && (
                    <p className="text-xs text-[#F5E6C8]/30 leading-relaxed line-clamp-2">{produto.descricao}</p>
                  )}
                  {precoOriginal && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-[#C9A84C]/10 mt-auto">
                      <Tag size={11} className="text-[#C9A84C]" />
                      {precoFinal ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs line-through text-[#F5E6C8]/25">R$ {precoOriginal}</span>
                          <span className="text-sm font-bold text-[#C9A84C]">R$ {precoFinal}</span>
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-[#C9A84C]">
                          {precoOriginal.startsWith("A") ? precoOriginal : `R$ ${precoOriginal}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
