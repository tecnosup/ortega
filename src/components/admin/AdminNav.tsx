"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  LayoutDashboard, Scissors, Settings, ClipboardList,
  LogOut, CalendarCheck, Tag, Menu, X,
} from "lucide-react";

const links = [
  { href: "/admin",               label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/agendamentos",  label: "Agendamentos", icon: CalendarCheck   },
  { href: "/admin/itens",         label: "Serviços",     icon: Scissors        },
  { href: "/admin/cupons",        label: "Cupons",       icon: Tag             },
  { href: "/admin/configuracoes", label: "Configurações",icon: Settings        },
  { href: "/admin/auditoria",     label: "Auditoria",    icon: ClipboardList   },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // fecha o drawer ao navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  // bloqueia scroll do body quando drawer aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
  }

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">
          Ortega Barber
        </span>
        {/* botão fechar — só aparece no drawer mobile */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden p-1 text-gray-500 hover:text-white transition"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition ${
                active
                  ? "bg-[#2d2d2d] text-[#b8944a] font-medium"
                  : "text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2d2d2d]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-red-400 transition w-full"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP: sidebar fixa ── */}
      <aside className="hidden md:flex w-56 bg-[#111] border-r border-[#2d2d2d] flex-col min-h-screen shrink-0">
        {navContent}
      </aside>

      {/* ── MOBILE: topbar com hamburger ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#111] border-b border-[#2d2d2d] flex items-center justify-between px-4 h-14">
        <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">
          Ortega Barber
        </span>
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-gray-400 hover:text-white transition"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── MOBILE: overlay escuro ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── MOBILE: drawer deslizante ── */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-[#111] border-r border-[#2d2d2d] flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
