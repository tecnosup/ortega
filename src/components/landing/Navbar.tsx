"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

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
            alt="Ortega Barber"
            width={40}
            height={40}
            className="object-contain drop-shadow-[0_0_8px_rgba(201,168,76,0.4)] group-hover:drop-shadow-[0_0_14px_rgba(201,168,76,0.7)] transition-all duration-300"
          />
          <span className="text-[#C9A84C] font-bold text-base sm:text-lg tracking-[0.2em] uppercase hidden sm:block">
            Ortega
          </span>
        </Link>

        {/* nav desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#F5E6C8]/60">
          <Link href="#sobre" className="hover:text-[#C9A84C] transition-colors duration-200 tracking-wide">Sobre</Link>
          <Link href="#servicos" className="hover:text-[#C9A84C] transition-colors duration-200 tracking-wide">Serviços</Link>
          <Link href="#depoimentos" className="hover:text-[#C9A84C] transition-colors duration-200 tracking-wide">Depoimentos</Link>
        </nav>

        {/* cta desktop */}
        <Link
          href="/agendamento"
          className="hidden md:inline-flex items-center px-5 py-2.5 border border-[#C9A84C] text-[#C9A84C] text-sm font-medium tracking-wider uppercase hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-300"
        >
          Agendar
        </Link>

        {/* botão agendar mobile — sempre visível */}
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

      {/* menu mobile */}
      {open && (
        <div className="md:hidden border-t border-[#C9A84C]/20 bg-[#0A0A0A]/98 backdrop-blur-md px-6 py-6 flex flex-col gap-1">
          {[
            { href: "#sobre", label: "Sobre" },
            { href: "#servicos", label: "Serviços" },
            { href: "#depoimentos", label: "Depoimentos" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="py-3.5 text-base text-[#F5E6C8]/70 hover:text-[#C9A84C] transition-colors tracking-wide border-b border-[#1a1a1a] last:border-0"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
