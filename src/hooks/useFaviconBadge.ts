"use client";

import { useEffect, useRef } from "react";

type Urgencia = "normal" | "atencao" | "critico";

const BADGE_COLOR: Record<Urgencia, string> = {
  normal: "#DC2626",   // vermelho
  atencao: "#D97706",  // âmbar
  critico: "#DC2626",  // vermelho (pulsa via title)
};

export function useFaviconBadge(count: number, urgencia: Urgencia = "normal") {
  const originalHref = useRef<string | null>(null);
  const originalTitle = useRef<string | null>(null);

  useEffect(() => {
    const link =
      (document.querySelector("link[rel~='icon']") as HTMLLinkElement) ??
      (() => {
        const el = document.createElement("link");
        el.rel = "icon";
        document.head.appendChild(el);
        return el;
      })();

    if (!originalHref.current) originalHref.current = link.href || "/favicon.ico";
    if (!originalTitle.current) originalTitle.current = document.title;

    if (count <= 0) {
      link.href = originalHref.current;
      document.title = originalTitle.current;
      return;
    }

    // Título da aba dinâmico
    const prefix = urgencia === "critico" ? `⚠️ (${count})` : `(${count})`;
    const baseTitle = originalTitle.current.replace(/^[^\w]*\(\d+\)\s*/, "");
    document.title = `${prefix} ${baseTitle}`;

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = originalHref.current;

    const render = () => {
      drawBadge(ctx, count, BADGE_COLOR[urgencia]);
      link.href = canvas.toDataURL("image/png");
    };

    img.onload = () => {
      ctx.drawImage(img, 0, 0, 32, 32);
      render();
    };

    img.onerror = () => {
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, 32, 32);
      render();
    };
  }, [count, urgencia]);
}

function drawBadge(ctx: CanvasRenderingContext2D, count: number, color: string) {
  const label = count > 99 ? "99+" : String(count);
  const badgeSize = label.length > 1 ? 13 : 11;
  const x = 32 - badgeSize;
  const y = badgeSize;

  ctx.beginPath();
  ctx.arc(x, y, badgeSize, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${label.length > 1 ? 9 : 11}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
}
