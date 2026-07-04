"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#produtos", label: "Produtos" },
  { href: "#assinaturas", label: "Assinaturas" },
  { href: "#depoimentos", label: "Depoimentos" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#C9A84C]/20 shadow-[0_2px_30px_rgba(201,168,76,0.08)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        {/* logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo-ortega.png"
            alt="Ortega"
            width={40}
            height={40}
            className="object-contain drop-shadow-[0_0_8px_rgba(201,168,76,0.4)] group-hover:drop-shadow-[0_0_14px_rgba(201,168,76,0.7)] transition-all duration-300"
          />
          <span className="text-[#C9A84C] font-bold text-base sm:text-lg tracking-[0.2em] uppercase hidden sm:block">
            Ortega
          </span>
        </Link>

        {/* nav desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#F5E6C8]/60">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-[#C9A84C] transition-colors duration-200 tracking-wide"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* cta desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/cliente/login"
            className="inline-flex items-center px-4 py-2.5 text-[#C9A84C]/70 text-sm font-medium tracking-wider uppercase hover:text-[#C9A84C] transition-colors duration-200"
          >
            Área do cliente
          </Link>
          <Link
            href="/agendamento"
            className="inline-flex items-center px-5 py-2.5 border border-[#C9A84C] text-[#C9A84C] text-sm font-medium tracking-wider uppercase hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-300"
          >
            Agendar
          </Link>
        </div>

        {/* mobile: botão agendar + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <Link
            href="/agendamento"
            className="inline-flex items-center px-4 py-2 bg-[#C9A84C] text-[#0A0A0A] text-xs font-bold tracking-wider uppercase"
          >
            Agendar
          </Link>
          <button className="p-2 text-[#F5E6C8]" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* menu mobile com animação */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="md:hidden border-t border-[#C9A84C]/20 bg-[#0A0A0A]/98 backdrop-blur-md px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex flex-col gap-0 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {NAV_LINKS.map(({ href, label }, idx) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block py-3.5 text-base text-[#F5E6C8]/70 hover:text-[#C9A84C] transition-colors tracking-wide border-b border-[#1a1a1a]"
                >
                  {label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: NAV_LINKS.length * 0.05 }}
            >
              <Link
                href="/cliente/login"
                onClick={() => setOpen(false)}
                className="block py-3.5 text-base text-[#C9A84C]/80 hover:text-[#C9A84C] transition-colors tracking-wide"
              >
                Área do cliente →
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
