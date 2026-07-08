"use client";

import { useState } from "react";
import {
  IconCalendar, IconCalendarPlus, IconLayoutDashboard, IconLogout, IconMenu2, IconScissors, IconUser, IconX,
} from "@tabler/icons-react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const NAV = [
  { href: "/cliente", label: "Início", icon: IconLayoutDashboard },
  { href: "/cliente/agendar", label: "Agendar", icon: IconCalendarPlus },
  { href: "/cliente/agendamentos", label: "Agendamentos", icon: IconCalendar },
  { href: "/cliente/perfil", label: "Perfil", icon: IconUser },
];

export default function ClienteNavbar({ nome }: { nome: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await fetch("/api/cliente/session", { method: "DELETE" });
    router.replace("/cliente/login");
  }

  return (
    <>
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <a href="/cliente" className="flex items-center gap-2">
            <IconScissors size={18} className="text-[#b8944a]" />
            <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase hidden sm:block">Ortega</span>
          </a>

          <span className="text-xs text-gray-500 hidden sm:block">Olá, <span className="text-[#F5E6C8] font-medium">{nome.split(" ")[0]}</span></span>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <a
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    active ? "bg-[#b8944a]/10 text-[#b8944a]" : "text-gray-500 hover:text-[#F5E6C8]"
                  }`}
                >
                  {label}
                </a>
              );
            })}
            <button
              onClick={sair}
              disabled={saindo}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:text-red-400 transition flex items-center gap-1"
            >
              <IconLogout size={13} /> Sair
            </button>
          </nav>

          {/* Mobile: botão menu */}
          <button onClick={() => setMenuOpen(true)} className="sm:hidden text-gray-500 hover:text-[#F5E6C8] transition">
            <IconMenu2 size={20} />
          </button>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0A0A] border-t border-[#1a1a1a] flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition ${
                active ? "text-[#b8944a]" : "text-gray-600"
              }`}
            >
              <Icon size={18} />
              {label}
            </a>
          );
        })}
        <button
          onClick={sair}
          disabled={saindo}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium text-gray-600"
        >
          <IconLogout size={18} />
          Sair
        </button>
      </nav>

      {/* Mobile drawer menu */}
      <AnimatePresence>
        {menuOpen && (
        <motion.div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={() => setMenuOpen(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <motion.div className="bg-[#111] border-b border-[#2d2d2d] p-5 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}
            initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#F5E6C8] font-medium">{nome}</span>
              <button onClick={() => setMenuOpen(false)}><IconX size={18} className="text-gray-500" /></button>
            </div>
            {NAV.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-400 hover:text-[#F5E6C8] hover:bg-[#1a1a1a] transition"
              >
                <Icon size={16} className="text-[#b8944a]" /> {label}
              </a>
            ))}
            <button
              onClick={sair}
              disabled={saindo}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition mt-1"
            >
              <IconLogout size={16} /> Sair
            </button>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
