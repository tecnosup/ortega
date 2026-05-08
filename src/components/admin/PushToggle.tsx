"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushToggle() {
  const { status, subscribe, unsubscribe } = usePushNotifications();

  if (status === "unsupported") return null;

  if (status === "granted") {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-3 px-3 py-2.5 text-sm text-green-400 hover:text-gray-400 hover:bg-[#1a1a1a] transition w-full rounded-lg"
        title="Notificações ativas — clique para desativar"
      >
        <Bell size={16} />
        <span>Notificações ativas</span>
        <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </button>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 w-full rounded-lg" title="Notificações bloqueadas pelo navegador">
        <BellOff size={16} />
        <span>Notificações bloqueadas</span>
      </div>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === "loading"}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#b8944a] hover:bg-[#b8944a]/10 transition w-full rounded-lg disabled:opacity-50"
    >
      {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
      <span>{status === "loading" ? "Ativando..." : "Ativar notificações"}</span>
    </button>
  );
}
