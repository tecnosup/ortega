"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SobreProps {
  texto: string;
  imagem?: string;
}

const STATS = [
  { num: 500, sufixo: "+", label: "Clientes" },
  { num: 5,   sufixo: "+", label: "Anos" },
  { num: 100, sufixo: "%", label: "Satisfação" },
];

export default function Sobre({ texto, imagem }: SobreProps) {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statsRef.current) return;

    const els = statsRef.current.querySelectorAll<HTMLSpanElement>("[data-count]");

    els.forEach((el) => {
      const target = Number(el.dataset.count);
      const sufixo = el.dataset.sufixo ?? "";
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 1.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
        onUpdate: () => {
          el.textContent = Math.round(obj.val) + sufixo;
        },
      });
    });

    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

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
            <span className="text-[#C9A84C]">Ortega Barber</span>
          </h2>
          <p className="text-sm sm:text-base text-[#F5E6C8]/60 leading-relaxed">{texto}</p>

          {/* stats com contador GSAP */}
          <div ref={statsRef} className="grid grid-cols-3 gap-3 sm:gap-4 py-4 border-t border-[#C9A84C]/15">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span
                  className="text-xl sm:text-2xl font-bold text-[#C9A84C]"
                  data-count={s.num}
                  data-sufixo={s.sufixo}
                >
                  0{s.sufixo}
                </span>
                <span className="text-xs text-[#F5E6C8]/40 tracking-wider uppercase">{s.label}</span>
              </div>
            ))}
          </div>

          <a
            href="#servicos"
            className="self-start inline-flex items-center px-6 py-3 border border-[#C9A84C] text-[#C9A84C] text-sm font-medium tracking-wider uppercase hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-300"
          >
            Ver serviços
          </a>
        </motion.div>
      </div>
    </section>
  );
}
