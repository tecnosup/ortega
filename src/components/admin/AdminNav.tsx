"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  LayoutDashboard, Scissors, Star, ClipboardList,
  LogOut, CalendarCheck, Tag, Menu, X, ShoppingBag, TrendingUp, ExternalLink, Users, DollarSign, CreditCard,
  BellRing, AlertTriangle, Bell, Calendar, Wallet,
} from "lucide-react";
import { useAdminNotificacoes } from "@/hooks/useAdminNotificacoes";
import { PushToggle } from "@/components/admin/PushToggle";

const links = [
  { href: "/admin",               label: "Dashboard",    icon: LayoutDashboard, badge: null as "agendamentos" | "financeiro" | null },
  { href: "/admin/agendamentos",  label: "Agendamentos", icon: CalendarCheck,   badge: "agendamentos" as const },
  { href: "/admin/financeiro",    label: "Financeiro",   icon: TrendingUp,      badge: "financeiro" as const },
  { href: "/admin/produtos",      label: "Produtos",     icon: ShoppingBag,     badge: null },
  { href: "/admin/itens",         label: "Serviços",     icon: Scissors,        badge: null },
  { href: "/admin/barbeiros",     label: "Funcionários", icon: Users,           badge: null },
  { href: "/admin/comissoes",     label: "Comissões",    icon: DollarSign,      badge: null },
  { href: "/admin/assinantes",    label: "Assinantes",   icon: CreditCard,      badge: null },
  { href: "/admin/descontos",     label: "Cupons",       icon: Tag,             badge: null },
  { href: "/admin/vitrine",       label: "Vitrine",      icon: Star,            badge: null },
  { href: "/admin/auditoria",     label: "Auditoria",    icon: ClipboardList,   badge: null },
];

const bottomLinks = [links[0], links[1], links[2], links[3]]; // Dashboard, Agendamentos, Financeiro, Produtos

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
  const notif = useAdminNotificacoes();
  const { pendentes, urgencia, caixasAbertos, vencimentos } = notif;
  const [modalAlertas, setModalAlertas] = useState(false);
  const totalAlertas = pendentes + caixasAbertos + vencimentos;

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

  function getBadgeInfo(badge: "agendamentos" | "financeiro" | null): { count: number; urg: "normal" | "atencao" | "critico" } {
    if (badge === "agendamentos") return { count: pendentes, urg: urgencia };
    return { count: 0, urg: "normal" };
  }

  const urgenciaTotal = caixasAbertos > 0 || pendentes > 0 ? "critico" : vencimentos > 0 ? "atencao" : "normal";

  const modalAleratasContent = modalAlertas && (
    <div className="fixed inset-0 z-[60] flex items-start justify-start bg-black/60 md:bg-transparent" onClick={() => setModalAlertas(false)}>
      <div className="md:ml-56 md:mt-0 md:h-screen w-full md:w-80 bg-[#141414] border-r border-b border-[#2d2d2d] shadow-2xl flex flex-col" style={{ marginTop: "calc(max(env(safe-area-inset-top), 0.75rem) + 3.5rem)", height: "calc(100dvh - max(env(safe-area-inset-top), 0.75rem) - 3.5rem)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1e1e1e] shrink-0">
          <div className="flex items-center gap-2">
            <BellRing size={15} className={urgenciaTotal === "critico" ? "text-red-400" : urgenciaTotal === "atencao" ? "text-amber-400" : "text-gray-400"} />
            <h3 className="font-bold text-[#F5E6C8] text-sm">Alertas ativos</h3>
            {totalAlertas > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${urgenciaTotal === "critico" ? "bg-red-500" : "bg-yellow-500"}`}>{totalAlertas}</span>
            )}
          </div>
          <button onClick={() => setModalAlertas(false)} className="text-gray-600 hover:text-gray-300"><X size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {totalAlertas === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-green-900/20 border border-green-800/30 flex items-center justify-center mb-3">
                <BellRing size={18} className="text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-400">Tudo em ordem</p>
              <p className="text-xs text-gray-500 mt-1">Nenhum alerta ativo no momento</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Agendamentos pendentes */}
              {pendentes > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-gray-600 px-1 py-2">Agendamentos</p>
                  <Link href="/admin/agendamentos" onClick={() => setModalAlertas(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition group">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${urgencia === "critico" ? "bg-red-900/30" : "bg-orange-900/30"}`}>
                      <Calendar size={13} className={urgencia === "critico" ? "text-red-400" : "text-orange-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#F5E6C8]">{pendentes} pendente{pendentes > 1 ? "s" : ""}</p>
                      {notif.hoje > 0 && <p className="text-[10px] text-gray-500">{notif.hoje} para hoje</p>}
                    </div>
                    <span className="text-[10px] text-gray-600 group-hover:text-[#b8944a] transition">→</span>
                  </Link>
                </div>
              )}

              {/* Caixas retroativos */}
              {caixasAbertos > 0 && (
                <div className="px-3 pb-2 border-t border-[#1a1a1a] pt-2">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-gray-600 px-1 py-2">Caixas em aberto</p>
                  {notif.caixasAbertosLista.map((data) => (
                    <Link key={data} href={`/admin/financeiro?dia=${data}#caixa`} onClick={() => setModalAlertas(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition group">
                      <div className="w-7 h-7 rounded-md bg-red-900/30 flex items-center justify-center shrink-0">
                        <Wallet size={13} className="text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-red-300">Caixa retroativo em aberto</p>
                        <p className="text-[10px] text-gray-500 capitalize">
                          {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-600 group-hover:text-red-400 transition">→</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Vencimentos */}
              {vencimentos > 0 && (
                <div className="px-3 pb-2 border-t border-[#1a1a1a] pt-2">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-gray-600 px-1 py-2">Vencimentos próximos</p>
                  {notif.vencimentosLista.map((v) => (
                    <Link key={v.id} href="/admin/financeiro" onClick={() => setModalAlertas(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition group">
                      <div className="w-7 h-7 rounded-md bg-amber-900/30 flex items-center justify-center shrink-0">
                        <Bell size={13} className="text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-amber-300 truncate">{v.descricao}</p>
                        <p className="text-[10px] text-gray-500">
                          {v.dias === 0 ? "Vence hoje" : v.dias < 0 ? `Vencido há ${Math.abs(v.dias)}d` : `Em ${v.dias}d`}
                          {" · "}{new Date(v.data + "T12:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-600 group-hover:text-amber-400 transition">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">Ortega Barber</span>
        <button onClick={() => setOpen(false)} className="md:hidden p-1.5 text-gray-500 hover:text-white transition rounded-lg hover:bg-[#2d2d2d]">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          const { count, urg } = getBadgeInfo(badge);
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
              {badge === "financeiro" ? (
                <div className="flex items-center gap-1">
                  {caixasAbertos > 0 && <BadgeDot count={caixasAbertos} urgencia="critico" />}
                  {vencimentos > 0 && <BadgeDot count={vencimentos} urgencia="atencao" />}
                </div>
              ) : count > 0 ? (
                <BadgeDot count={count} urgencia={urg} />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#2d2d2d] flex flex-col gap-0.5">
        <button
          onClick={() => { setModalAlertas(true); setOpen(false); }}
          className={`flex items-center gap-3 px-3 py-2.5 text-sm transition w-full rounded-lg ${totalAlertas > 0 ? "text-[#b8944a] hover:bg-[#b8944a]/10" : "text-gray-500 hover:bg-[#1a1a1a]"}`}
        >
          <BellRing size={16} />
          <span className="flex-1 text-left">Alertas</span>
          {totalAlertas > 0 && (
            <span className={`text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white ${urgenciaTotal === "critico" ? "bg-red-500" : "bg-yellow-500"}`}>
              {totalAlertas > 99 ? "99+" : totalAlertas}
            </span>
          )}
        </button>
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
      {modalAleratasContent}

      {/* ── DESKTOP: sidebar fixa ── */}
      <aside className="hidden md:flex w-56 bg-[#111] border-r border-[#2d2d2d] flex-col fixed left-0 top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* ── MOBILE: bloco que tampa a status bar (mesmo fundo da topbar) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111]" style={{ height: "env(safe-area-inset-top, 0px)" }} />

      {/* ── MOBILE: topbar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#111]/95 backdrop-blur-md border-b border-[#2d2d2d] flex items-end justify-between px-4 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 44px) + 0.25rem)" }}>
        <span className="text-[#b8944a] font-bold text-sm tracking-widest uppercase">Ortega</span>
        <Link href="/" className="p-2 text-gray-400 hover:text-[#b8944a] transition" aria-label="Ver site">
          <ExternalLink size={18} />
        </Link>
      </div>

      {/* ── MOBILE: bottom navigation bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111]/95 backdrop-blur-md border-t border-[#2d2d2d] flex items-stretch" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 34px) + 0.25rem)" }}>
        {bottomLinks.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          const { count, urg } = getBadgeInfo(badge);
          const finTotal = (badge === "financeiro") ? caixasAbertos + vencimentos : 0;
          const finUrg = caixasAbertos > 0 ? "critico" : "atencao";
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
                {badge === "financeiro" && finTotal > 0 ? (
                  <span className={`absolute -top-1.5 -right-2 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center leading-none ${finUrg === "atencao" ? "bg-yellow-500" : "bg-red-500"}`}>
                    {finTotal > 9 ? "9+" : finTotal}
                  </span>
                ) : count > 0 ? (
                  <span className={`absolute -top-1.5 -right-2 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center leading-none ${urg === "atencao" ? "bg-yellow-500" : "bg-red-500"}`}>
                    {count > 9 ? "9+" : count}
                  </span>
                ) : null}
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
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#111] border-r border-[#2d2d2d] flex flex-col transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
