"use client";

import { useEffect, useState } from "react";

export type PushStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function useBarbeiroPush() {
  const [status, setStatus] = useState<PushStatus>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setStatus("granted");
    else if (Notification.permission === "denied") setStatus("denied");
  }, []);

  async function subscribe() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      const json = sub.toJSON();
      await fetch("/api/barbeiro/push-subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setStatus("granted");
    } catch {
      setStatus("denied");
    }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await fetch("/api/barbeiro/push-subscription", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      setStatus("idle");
    } catch {
      // silencia
    }
  }

  return { status, subscribe, unsubscribe };
}
