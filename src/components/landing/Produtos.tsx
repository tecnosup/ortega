"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Tag } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Produto } from "@/lib/admin-produtos";
import type { Desconto } from "@/lib/admin-descontos";
import type { Categoria } from "@/lib/admin-categorias";

gsap.registerPlugin(ScrollTrigger);

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

export default function Produtos({ produtos, descontos, whatsappNumber, categorias = [] }: ProdutosProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [activeCategoria, setActiveCategoria] = useState<string>("todos");
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll<HTMLElement>(".gsap-card");
    gsap.fromTo(cards,
      { opacity: 0, y: 36, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: gridRef.current, start: "top 80%", once: true } }
    );
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, [produtos, activeCategoria]);

  if (produtos.length === 0) return null;

  const categoriasComProdutos = categorias.filter((cat) =>
    produtos.some((p) => p.categoriaId === cat.id)
  );

  const mostrarAbas = categoriasComProdutos.length > 0;

  const produtosFiltrados = activeCategoria === "todos"
    ? produtos
    : produtos.filter((p) => p.categoriaId === activeCategoria);

  return (
    <section id="produtos" className="py-20 md:py-28 bg-[#0A0A0A] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* cabeçalho */}
        <motion.div
          className="text-center mb-10 md:mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
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
        </motion.div>

        {/* filtro de categorias */}
        {mostrarAbas && (
          <motion.div
            className="flex items-center justify-center gap-2 flex-wrap mb-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
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
          </motion.div>
        )}

        {/* mobile: scroll horizontal */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
            {produtosFiltrados.map((produto, idx) => {
              const desconto = descontos?.get(produto.id);
              const precoOriginal = produto.preco;
              const precoFinal = desconto && precoOriginal && !precoOriginal.startsWith("A")
                ? precoComDesconto(precoOriginal, desconto.percentual)
                : null;

              return (
                <motion.div
                  key={produto.id}
                  className="relative flex flex-col bg-white/[0.03] backdrop-blur-sm border border-[#C9A84C]/10 overflow-hidden"
                  style={{ width: 180 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                >
                  {desconto && (
                    <span className="absolute top-2 left-2 z-10 bg-[#C9A84C] text-[#0A0A0A] text-[9px] font-black px-1.5 py-0.5 tracking-wider uppercase">
                      -{desconto.percentual}%
                    </span>
                  )}
                  <div className="relative overflow-hidden bg-[#1a1a1a]" style={{ aspectRatio: "3/4" }}>
                    {produto.imagem ? (
                      <img src={produto.imagem} alt={produto.titulo} className="w-full h-full object-cover" />
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
                  <a
                    href={whatsappNumber
                      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${produto.titulo}`)}`
                      : "#"}
                    target={whatsappNumber ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="py-2.5 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-black tracking-widest uppercase text-center active:scale-[0.97] transition-transform"
                  >
                    Comprar
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* desktop: grid com glassmorphism */}
        <div ref={gridRef} className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5">
          {produtosFiltrados.map((produto, idx) => {
            const desconto = descontos?.get(produto.id);
            const precoOriginal = produto.preco;
            const precoFinal = desconto && precoOriginal && !precoOriginal.startsWith("A")
              ? precoComDesconto(precoOriginal, desconto.percentual)
              : null;
            const isHovered = hoverId === produto.id;

            return (
              <div
                key={produto.id}
                className="gsap-card relative flex flex-col bg-white/[0.03] backdrop-blur-sm border border-[#C9A84C]/10 overflow-hidden transition-all duration-500 group"
                onMouseEnter={() => setHoverId(produto.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  borderColor: isHovered ? "rgba(201,168,76,0.5)" : undefined,
                  transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                  boxShadow: isHovered ? "0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(201,168,76,0.08)" : undefined,
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
                <a
                  href={whatsappNumber
                    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${produto.titulo}`)}`
                    : "#"}
                  target={whatsappNumber ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="mx-4 mb-4 flex items-center justify-center py-2.5 bg-[#C9A84C] text-[#0A0A0A] text-xs font-black tracking-widest uppercase hover:bg-[#E2C06A] active:scale-[0.97] transition-all duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  Comprar via WhatsApp
                </a>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
