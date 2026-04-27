"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="w-24 h-8 bg-gray-200 flex items-center justify-center text-xs text-gray-400">
          [LOGO]
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <Link href="#sobre" className="hover:text-gray-900 transition">Link 1</Link>
          <Link href="#servicos" className="hover:text-gray-900 transition">Link 2</Link>
          <Link href="#depoimentos" className="hover:text-gray-900 transition">Link 3</Link>
        </nav>

        <Link
          href="/contato"
          className="hidden md:inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-700 transition"
        >
          Fale conosco
        </Link>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white px-6 py-4 flex flex-col gap-4 text-sm text-gray-600">
          <Link href="#sobre" onClick={() => setOpen(false)}>Link 1</Link>
          <Link href="#servicos" onClick={() => setOpen(false)}>Link 2</Link>
          <Link href="#depoimentos" onClick={() => setOpen(false)}>Link 3</Link>
          <Link href="/contato" className="bg-gray-900 text-white px-4 py-2 text-center" onClick={() => setOpen(false)}>
            Fale conosco
          </Link>
        </div>
      )}
    </header>
  );
}
