"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken(true);

      // Tenta admin primeiro
      const adminRes = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (adminRes.ok) {
        router.replace("/admin");
        return;
      }

      // Se não é admin, tenta barbeiro
      if (adminRes.status === 403) {
        const barbeiroRes = await fetch("/api/barbeiro/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (barbeiroRes.ok) {
          router.replace("/barbeiro");
          return;
        }

        setError("Conta não autorizada para este sistema");
        return;
      }

      const data = await adminRes.json();
      setError(data.error ?? "Erro ao autenticar");
    } catch {
      setError("E-mail ou senha incorretos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen-safe bg-[#0A0A0A] flex flex-col items-center justify-center px-6 py-12">

      {/* Brilho sutil no topo */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20"
        style={{
          background: "radial-gradient(ellipse at top, #b8944a 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-28 h-28">
            <Image
              src="/logo-ortega.png"
              alt="Ortega Barber"
              fill
              className="object-contain drop-shadow-[0_0_24px_rgba(184,148,74,0.35)]"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-[#b8944a] font-bold text-2xl tracking-[0.25em] uppercase">
              Ortega Barber
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-px bg-[#2d2d2d]" />
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">Portal Interno</p>
              <div className="flex-1 h-px bg-[#2d2d2d]" />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="w-full bg-[#111] border border-[#2d2d2d] rounded-2xl p-7 flex flex-col gap-5 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* E-mail */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full bg-[#0A0A0A] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm text-[#F5E6C8] placeholder-gray-700 focus:outline-none focus:border-[#b8944a]/60 focus:ring-1 focus:ring-[#b8944a]/20 transition-all"
                style={{ fontSize: 16 }}
              />
            </label>

            {/* Senha */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#0A0A0A] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm text-[#F5E6C8] placeholder-gray-700 focus:outline-none focus:border-[#b8944a]/60 focus:ring-1 focus:ring-[#b8944a]/20 transition-all"
                style={{ fontSize: 16 }}
              />
            </label>

            {/* Erro */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
                <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <p className="text-red-400 text-sm leading-snug">{error}</p>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 mt-1 rounded-xl font-bold text-sm tracking-widest uppercase overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: loading
                  ? "#2d2d2d"
                  : "linear-gradient(135deg, #b8944a 0%, #c9a84c 50%, #a07838 100%)",
                color: loading ? "#666" : "#0A0A0A",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 text-gray-500">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Verificando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-gray-700 tracking-wide text-center">
          Acesso restrito · Ortega Barber © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
