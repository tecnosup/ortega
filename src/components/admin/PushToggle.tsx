"use client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  IconBell, IconBellOff, IconLoader2,
} from "@tabler/icons-react";

export function PushToggle() {
  const { status, subscribe, unsubscribe } = usePushNotifications();

  if (status === "unsupported") return null;

  if (status === "granted") {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-3 px-3 py-2.5 text-sm text-green-400 hover:text-gray-400 hover:bg-[#1a1a1a] transition w-full rounded-lg min-w-0"
        title="Notificações ativas — clique para desativar"
      >
        <IconBell size={16} className="shrink-0" />
        <span className="flex-1 text-left">Notificações</span>
        <span className="shrink-0 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </button>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 w-full rounded-lg min-w-0" title="Notificações bloqueadas pelo navegador">
        <IconBellOff size={16} className="shrink-0" />
        <span>Notificações</span>
      </div>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === "loading"}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#b8944a] hover:bg-[#b8944a]/10 transition w-full rounded-lg disabled:opacity-50 min-w-0"
    >
      {status === "loading" ? <IconLoader2 size={16} className="animate-spin shrink-0" /> : <IconBell size={16} className="shrink-0" />}
      <span>{status === "loading" ? "Ativando..." : "Notificações"}</span>
    </button>
  );
}
