"use client";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const [vals, setVals] = useState({ top: "?", bottom: "?", left: "?", right: "?", vh: "?", dvh: "?" });

  useEffect(() => {
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);";
    document.body.appendChild(el);
    const s = getComputedStyle(el);
    setVals({
      top: s.paddingTop,
      bottom: s.paddingBottom,
      left: s.paddingLeft,
      right: s.paddingRight,
      vh: window.innerHeight + "px",
      dvh: document.documentElement.clientHeight + "px",
    });
    document.body.removeChild(el);
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", fontSize: "18px", lineHeight: "2" }}>
      <h1 style={{ fontSize: "22px", marginBottom: "1rem" }}>Safe Area Debug</h1>
      <div>safe-area-inset-top: <strong style={{ color: "lime" }}>{vals.top}</strong></div>
      <div>safe-area-inset-bottom: <strong style={{ color: "lime" }}>{vals.bottom}</strong></div>
      <div>safe-area-inset-left: <strong style={{ color: "lime" }}>{vals.left}</strong></div>
      <div>safe-area-inset-right: <strong style={{ color: "lime" }}>{vals.right}</strong></div>
      <hr style={{ margin: "1rem 0", borderColor: "#555" }} />
      <div>window.innerHeight: <strong style={{ color: "yellow" }}>{vals.vh}</strong></div>
      <div>clientHeight: <strong style={{ color: "yellow" }}>{vals.dvh}</strong></div>
      <hr style={{ margin: "1rem 0", borderColor: "#555" }} />
      <div style={{ fontSize: "13px", color: "#aaa" }}>viewport-fit: cover está ativo?</div>
      <div style={{ height: "env(safe-area-inset-top)", background: "red", marginTop: "0.5rem" }} />
      <div style={{ fontSize: "13px", color: "#aaa", marginTop: "0.5rem" }}>^ essa barra vermelha deve ter a altura do notch</div>
    </div>
  );
}
