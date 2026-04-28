"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#2d2d2d]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-[#b8944a] font-bold text-xl tracking-widest uppercase">
          Ortega Barber
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          <Link href="#sobre" className="hover:text-[#b8944a] transition">Sobre</Link>
          <Link href="#servicos" className="hover:text-[#b8944a] transition">Serviços</Link>
          <Link href="#depoimentos" className="hover:text-[#b8944a] transition">Depoimentos</Link>
        </nav>

        <Link
          href="/agendamento"
          className="hidden md:inline-flex items-center px-4 py-2 bg-[#b8944a] text-white text-sm font-medium hover:bg-[#a07d3a] transition"
        >
          Agendar horário
        </Link>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#2d2d2d] bg-[#1a1a1a] px-6 py-4 flex flex-col gap-4 text-sm text-gray-300">
          <Link href="#sobre" onClick={() => setOpen(false)} className="hover:text-[#b8944a] transition">Sobre</Link>
          <Link href="#servicos" onClick={() => setOpen(false)} className="hover:text-[#b8944a] transition">Serviços</Link>
          <Link href="#depoimentos" onClick={() => setOpen(false)} className="hover:text-[#b8944a] transition">Depoimentos</Link>
          <Link
            href="/agendamento"
            className="bg-[#b8944a] text-white px-4 py-2 text-center font-medium"
            onClick={() => setOpen(false)}
          >
            Agendar horário
          </Link>
        </div>
      )}
    </header>
  );
}
