"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  LayoutDashboard, Scissors, Star, ClipboardList,
  LogOut, CalendarCheck, Tag, Menu, X, ShoppingBag, TrendingUp, ExternalLink, Users, DollarSign,
} from "lucide-react";
import { useAdminNotificacoes } from "@/hooks/useAdminNotificacoes";
import { PushToggle } from "@/components/admin/PushToggle";

const links = [
  { href: "/admin",               label: "Dashboard",    icon: LayoutDashboard, badge: null as "agendamentos" | "financeiro" | null },
  { href: "/admin/agendamentos",  label: "Agendamentos", icon: CalendarCheck,   badge: "agendamentos" as const },
  { href: "/admin/financeiro",    label: "Financeiro",   icon: TrendingUp,      badge: "financeiro" as const },
  { href: "/admin/barbeiros",     label: "Barbeiros",    icon: Users,           badge: null },
  { href: "/admin/comissoes",     label: "Comissões",    icon: DollarSign,      badge: null },
  { href: "/admin/itens",         label: "Serviços",     icon: Scissors,        badge: null },
  { href: "/admin/produtos",      label: "Produtos",     icon: ShoppingBag,     badge: null },
  { href: "/admin/descontos",     label: "Descontos",    icon: Tag,             badge: null },
  { href: "/admin/vitrine",       label: "Vitrine",      icon: Star,            badge: null },
  { href: "/admin/auditoria",     label: "Auditoria",    icon: ClipboardList,   badge: null },
];

const bottomLinks = links.slice(0, 4);

function BadgeDot({ count, urgencia }: { count: number; urgencia: "normal" | "atencao" | "critico" }) {
  if (count <= 0) return null;
  const cor = urgencia === "atencao" ? "bg-yellow-500" : "bg-red-500";
  return (
    <span className={`${cor} text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center leading-none`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pendentes, urgencia } = useAdminNotificacoes();

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

  function getBadgeCount(badge: "agendamentos" | "financeiro" | null) {
    if (badge === "agendamentos") return pendentes;
    return 0;
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
        {links.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          const count = getBadgeCount(badge);
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
              <span className="flex-1">{label}</span>
              {count > 0 && <BadgeDot count={count} urgencia={urgencia} />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#2d2d2d] flex flex-col gap-0.5">
        <PushToggle />
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

      {/* ── MOBILE: topbar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#111]/95 backdrop-blur-md border-b border-[#2d2d2d] flex items-center justify-between px-4 h-14">
        <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">Ortega</span>
        <Link href="/" className="p-2 text-gray-400 hover:text-[#b8944a] transition" aria-label="Ver site">
          <ExternalLink size={18} />
        </Link>
      </div>

      {/* ── MOBILE: bottom navigation bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111]/95 backdrop-blur-md border-t border-[#2d2d2d] flex items-stretch h-16 safe-area-inset-bottom">
        {bottomLinks.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          const count = getBadgeCount(badge);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition relative ${
                active ? "text-[#b8944a]" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {count > 0 && (
                  <span className={`absolute -top-1.5 -right-2 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center leading-none ${urgencia === "atencao" ? "bg-yellow-500" : "bg-red-500"}`}>
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-gray-600 hover:text-gray-400 transition"
        >
          <Menu size={20} strokeWidth={1.8} />
          <span>Mais</span>
        </button>
      </nav>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

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
