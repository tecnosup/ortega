"use client";

import Link from "next/link";
import {
  IconBell, IconBellOff, IconCalendarCheck, IconLoader2, IconLogout, IconTrendingUp,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useBarbeiroPush } from "@/hooks/useBarbeiroPush";

const links = [
  { href: "/barbeiro",           label: "Agenda",     icon: IconCalendarCheck },
  { href: "/barbeiro/financeiro", label: "Financeiro", icon: IconTrendingUp },
];

export default function BarbeiroNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { status: pushStatus, subscribe, unsubscribe } = useBarbeiroPush();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/barbeiro/session", { method: "DELETE" });
    router.replace("/barbeiro/login");
  }

  return (
    <>
      {/* Topbar mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#111]/95 backdrop-blur-md border-b border-[#2d2d2d] flex items-center justify-between px-4 h-14">
        <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">Ortega</span>
        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 transition">
          <IconLogout size={18} />
        </button>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111]/95 backdrop-blur-md border-t border-[#2d2d2d] flex items-stretch h-16">
        {links.map(({ href, label, icon: Icon }) => {
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
      </nav>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-52 bg-[#111] border-r border-[#2d2d2d] flex-col min-h-screen shrink-0">
        <div className="p-5 border-b border-[#2d2d2d]">
          <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">Ortega</span>
          <p className="text-xs text-gray-600 mt-0.5">Portal do Barbeiro</p>
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

        <div className="p-3 border-t border-[#2d2d2d] flex flex-col gap-0.5">
          {pushStatus !== "unsupported" && (
            pushStatus === "granted" ? (
              <button onClick={unsubscribe} className="flex items-center gap-3 px-3 py-2.5 text-sm text-green-400 hover:text-gray-400 hover:bg-[#1a1a1a] transition w-full rounded-lg">
                <IconBell size={16} />
                <span className="flex-1">Notificações ativas</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </button>
            ) : pushStatus === "denied" ? (
              <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 w-full rounded-lg">
                <IconBellOff size={16} /> <span>Notificações bloqueadas</span>
              </div>
            ) : (
              <button onClick={subscribe} disabled={pushStatus === "loading"} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#b8944a] hover:bg-[#b8944a]/10 transition w-full rounded-lg disabled:opacity-50">
                {pushStatus === "loading" ? <IconLoader2 size={16} className="animate-spin" /> : <IconBell size={16} />}
                <span>{pushStatus === "loading" ? "Ativando..." : "Ativar notificações"}</span>
              </button>
            )
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/10 transition w-full rounded-lg"
          >
            <IconLogout size={16} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
