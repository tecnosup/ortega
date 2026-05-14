"use client";

import { motion } from "framer-motion";

const DEPOIMENTOS = [
  {
    id: "1",
    nome: "Rafael Mendes",
    cargo: "Cliente desde 2021",
    texto: "Melhor barbearia da região. O corte ficou exatamente como pedi, ambiente top e atendimento impecável. Já virei cliente fixo.",
    estrelas: 5,
  },
  {
    id: "2",
    nome: "Lucas Ferreira",
    cargo: "Cliente desde 2022",
    texto: "Fui pela primeira vez indicado por um amigo e não me arrependi. O barbeiro foi atencioso, tirou minhas dúvidas e o resultado superou o que eu esperava.",
    estrelas: 5,
  },
  {
    id: "3",
    nome: "Diego Alves",
    cargo: "Assinante Clube Ortega",
    texto: "Agendei pelo site em menos de dois minutos, fui atendido no horário certinho. Corte e barba alinhados, saí de lá outro homem.",
    estrelas: 5,
  },
];

function Estrelas({ n }: { n: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < n ? "#C9A84C" : "none"}
          stroke="#C9A84C"
          strokeWidth="1.5"
          className={i < n ? "opacity-100" : "opacity-20"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function Depoimentos() {
  return (
    <section id="depoimentos" className="py-20 md:py-28 bg-[#0A0A0A] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(201,168,76,0.04)_0%,transparent_70%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-medium tracking-[0.3em] uppercase">Clientes</span>
            <span className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >O que dizem sobre nós</h2>
        </motion.div>

        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {DEPOIMENTOS.map((d, idx) => (
            <motion.div
              key={d.id}
              className="relative bg-white/[0.03] backdrop-blur-sm border border-[#C9A84C]/10 p-6 flex flex-col gap-4 hover:border-[#C9A84C]/30 hover:bg-white/[0.05] transition-all duration-300 shrink-0 w-[80vw] sm:w-[60vw] md:w-auto snap-center"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: idx * 0.12 }}
            >
              {/* aspas decorativas */}
              <span className="absolute top-4 right-5 text-5xl leading-none text-[#C9A84C]/10 font-serif select-none">"</span>

              <Estrelas n={d.estrelas} />

              <p className="text-sm text-[#F5E6C8]/60 leading-relaxed italic flex-1">"{d.texto}"</p>

              <div className="flex items-center gap-3 pt-4 border-t border-[#C9A84C]/10">
                {/* avatar circular com inicial */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C]/40 to-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] text-sm font-bold shrink-0">
                  {d.nome.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F5E6C8] leading-tight">{d.nome}</p>
                  <p className="text-xs text-[#F5E6C8]/30 mt-0.5">{d.cargo}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
