"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  LayoutDashboard, Scissors, Settings, ClipboardList,
  LogOut, CalendarCheck, Tag, Menu, X, ShoppingBag, TrendingUp, ExternalLink,
} from "lucide-react";

const links = [
  { href: "/admin",               label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/agendamentos",  label: "Agendamentos", icon: CalendarCheck   },
  { href: "/admin/financeiro",    label: "Financeiro",   icon: TrendingUp      },
  { href: "/admin/itens",         label: "Serviços",     icon: Scissors        },
  { href: "/admin/produtos",      label: "Produtos",     icon: ShoppingBag     },
  { href: "/admin/descontos",     label: "Descontos",    icon: Tag             },
  { href: "/admin/configuracoes", label: "Config",       icon: Settings        },
  { href: "/admin/auditoria",     label: "Auditoria",    icon: ClipboardList   },
];

// links que aparecem na bottom bar mobile (os 4 mais usados)
const bottomLinks = links.slice(0, 4);
// "Mais" abre drawer com o restante
const drawerLinks = links;

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">Ortega Barber</span>
        <button onClick={() => setOpen(false)} className="md:hidden p-1.5 text-gray-500 hover:text-white transition rounded-lg hover:bg-[#2d2d2d]">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                active
                  ? "bg-[#b8944a]/15 text-[#b8944a] font-medium"
                  : "text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#2d2d2d]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/10 transition w-full rounded-lg"
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
        {sidebarContent}
      </aside>

      {/* ── MOBILE: topbar com título + link para o site ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#111]/95 backdrop-blur-md border-b border-[#2d2d2d] flex items-center justify-between px-4 h-14">
        <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">Ortega</span>
        <Link
          href="/"
          className="p-2 text-gray-400 hover:text-[#b8944a] transition"
          aria-label="Ver site"
        >
          <ExternalLink size={18} />
        </Link>
      </div>

      {/* ── MOBILE: bottom navigation bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111]/95 backdrop-blur-md border-t border-[#2d2d2d] flex items-stretch h-16 safe-area-inset-bottom">
        {bottomLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition ${
                active ? "text-[#b8944a]" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
        {/* botão "Mais" para o drawer */}
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-gray-600 hover:text-gray-400 transition"
        >
          <Menu size={20} strokeWidth={1.8} />
          <span>Mais</span>
        </button>
      </nav>

      {/* ── MOBILE: overlay ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── MOBILE: drawer lateral completo ── */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#111] border-r border-[#2d2d2d] flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
