"use client";

import { useEffect } from "react";

export default function SafeAreaProvider() {
  useEffect(() => {
    function update() {
      const style = getComputedStyle(document.documentElement);
      const top = style.getPropertyValue("--sat").trim() ||
        getComputedStyle(document.body).getPropertyValue("padding-top");

      // Cria um elemento temporário para ler os valores reais
      const el = document.createElement("div");
      el.style.cssText = [
        "position:fixed",
        "top:env(safe-area-inset-top,0px)",
        "left:env(safe-area-inset-left,0px)",
        "right:env(safe-area-inset-right,0px)",
        "bottom:env(safe-area-inset-bottom,0px)",
        "width:1px",
        "height:1px",
        "pointer-events:none",
        "visibility:hidden",
      ].join(";");
      document.body.appendChild(el);

      const rect = el.getBoundingClientRect();
      const sat = rect.top;
      const sab = window.innerHeight - rect.bottom;

      document.documentElement.style.setProperty("--sat", `${Math.max(sat, 0)}px`);
      document.documentElement.style.setProperty("--sab", `${Math.max(sab, 0)}px`);

      document.body.removeChild(el);
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return null;
}
