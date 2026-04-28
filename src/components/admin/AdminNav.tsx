"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LayoutDashboard, Scissors, Settings, ClipboardList, LogOut, CalendarCheck } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agendamentos", label: "Agendamentos", icon: CalendarCheck },
  { href: "/admin/itens", label: "Serviços", icon: Scissors },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin/auditoria", label: "Auditoria", icon: ClipboardList },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
  }

  return (
    <aside className="w-56 bg-[#1a1a1a] border-r border-[#2d2d2d] flex flex-col">
      <div className="p-6 border-b border-[#2d2d2d]">
        <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">
          Ortega Barber
        </span>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition ${
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
    </aside>
  );
}
