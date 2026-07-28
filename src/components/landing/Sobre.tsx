"use client";

import { motion, useInView, useReducedMotion, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface SobreProps {
  texto: string;
  imagem?: string;
  /** Clientes distintos já atendidos (contador do Firestore). 0 = esconde o stat. */
  clientes?: number;
}

/**
 * Contador animado que NUNCA mostra número errado.
 *
 * A versão anterior renderizava uma MotionValue começando em 0 e só chegava no
 * valor real se a animação rodasse. No mobile ela travava e a landing exibia
 * "0+ clientes" — e o HTML do servidor saía com 0 em todos os stats, então até
 * buscador/preview via zero.
 *
 * Agora o valor FINAL é o estado inicial (SSR e fallback corretos) e a animação é
 * só enfeite: só zera o número quando de fato vai contar até ele, e sempre termina
 * no alvo. Sem JS, com IntersectionObserver quebrado ou com "reduzir movimento"
 * ligado, o número certo continua na tela.
 */
function CountUp({ target, sufixo }: { target: number; sufixo: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const semMovimento = useReducedMotion();
  const [valor, setValor] = useState(target);
  const [zerado, setZerado] = useState(false);
  const animou = useRef(false);

  // Zera SÓ se a seção começar fora da tela — aí existe uma rolagem pela frente
  // pra contar durante. Se ela já está visível no load (tela alta, link direto
  // pra #sobre), animar significaria pular do número certo pra 0 na cara do
  // visitante: nesse caso não anima, mostra o valor e pronto.
  useEffect(() => {
    if (semMovimento) return;
    const el = ref.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight) {
      setValor(0);
      setZerado(true);
    }
  }, [semMovimento]);

  useEffect(() => {
    if (!zerado || !inView || animou.current) return;
    animou.current = true;
    const controls = animate(0, target, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => setValor(Math.round(v)),
      onComplete: () => setValor(target),
    });
    return () => {
      controls.stop();
      setValor(target); // desmontou no meio da contagem? fica o valor certo
    };
  }, [zerado, inView, target]);

  return (
    <span ref={ref}>
      {valor}
      {sufixo}
    </span>
  );
}

export default function Sobre({ texto, imagem, clientes = 0 }: SobreProps) {
  const stats = [
    // Só entra na régua quando já há histórico de verdade — "0+ clientes" ou
    // "12+ clientes" contam mais contra do que a favor. Arredonda pra baixo em
    // dezenas: 137 atendidos vira "130+", nunca promete mais do que tem.
    ...(clientes >= 30 ? [{ num: Math.floor(clientes / 10) * 10, sufixo: "+", label: "Clientes" }] : []),
    { num: 5, sufixo: "+", label: "Anos" },
    { num: 100, sufixo: "%", label: "Satisfação" },
  ];

  return (
    <section id="sobre" className="py-20 md:py-28 bg-[#0A0A0A] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

        {/* imagem */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute -inset-1 bg-gradient-to-br from-[#C9A84C]/30 via-transparent to-[#C9A84C]/10 rounded-sm" />
          <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden border border-[#C9A84C]/20">
            <img
              src={imagem || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80"}
              alt="Interior da barbearia Ortega"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 to-transparent" />
          </div>
          <div className="absolute -bottom-3 -right-3 w-12 h-12 md:w-16 md:h-16 border-r-2 border-b-2 border-[#C9A84C]/40" />
          <div className="absolute -top-3 -left-3 w-12 h-12 md:w-16 md:h-16 border-l-2 border-t-2 border-[#C9A84C]/40" />
        </motion.div>

        <motion.div
          className="flex flex-col gap-5 md:gap-6"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Nossa história</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8] leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Sobre o<br />
            <span className="text-[#C9A84C]">Ortega</span>
          </h2>
          <p className="text-sm sm:text-base text-[#F5E6C8]/60 leading-relaxed">{texto}</p>

          <div
            className={`grid ${stats.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-3 sm:gap-4 py-4 border-t border-[#C9A84C]/15`}
          >
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span className="text-xl sm:text-2xl font-bold text-[#C9A84C]">
                  <CountUp target={s.num} sufixo={s.sufixo} />
                </span>
                <span className="text-xs text-[#F5E6C8]/40 tracking-wider uppercase">{s.label}</span>
              </div>
            ))}
          </div>

          <a
            href="#servicos"
            className="self-center sm:self-start inline-flex items-center px-6 py-3 border border-[#C9A84C] text-[#C9A84C] text-sm font-medium tracking-wider uppercase hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-300"
          >
            Ver serviços
          </a>
        </motion.div>
      </div>
    </section>
  );
}
