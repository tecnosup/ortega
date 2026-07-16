"use client";

import { useState, useEffect, Suspense } from "react";
import {
  IconLoader2,
} from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function LoginConteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [boasVindas, setBoasVindas] = useState("");

  useEffect(() => {
    const msg = params.get("msg");
    if (msg === "conta-criada") setBoasVindas("Conta criada! Faça login para acessar sua área.");
    if (msg === "sessao-expirada") setBoasVindas("Sua sessão expirou. Entre novamente.");
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/cliente/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), senha }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao autenticar"); return; }
      const next = params.get("next") ?? "/cliente";
      router.replace(next);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 py-12">
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20"
        style={{ background: "radial-gradient(ellipse at top, #b8944a 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24">
            <Image
              src="/logo-ortega.png"
              alt="Ortega"
              fill
              className="object-contain drop-shadow-[0_0_24px_rgba(184,148,74,0.35)]"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-[#b8944a] font-bold text-2xl tracking-[0.25em] uppercase">Ortega</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-px bg-[#2d2d2d]" />
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">Área do Assinante</p>
              <div className="flex-1 h-px bg-[#2d2d2d]" />
            </div>
          </div>
        </div>

        <div className="w-full bg-[#111] border border-[#2d2d2d] rounded-2xl p-7 flex flex-col gap-5 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          {boasVindas && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3">
              <p className="text-green-400 text-sm">{boasVindas}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#0A0A0A] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm text-[#F5E6C8] placeholder-gray-700 focus:outline-none focus:border-[#b8944a]/60 focus:ring-1 focus:ring-[#b8944a]/20 transition-all"
                style={{ fontSize: 16 }}
              />
            </label>

            {erro && (
              <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
                <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <p className="text-red-400 text-sm leading-snug">{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 mt-1 rounded-xl font-bold text-sm tracking-widest uppercase overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: loading ? "#2d2d2d" : "linear-gradient(135deg, #b8944a 0%, #c9a84c 50%, #a07838 100%)",
                color: loading ? "#666" : "#0A0A0A",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 text-gray-500">
                  <IconLoader2 size={16} className="animate-spin" /> Verificando...
                </span>
              ) : "Entrar"}
            </button>
          </form>

          <div className="flex flex-col gap-2 pt-1 border-t border-[#1a1a1a]">
            <p className="text-xs text-gray-600 text-center">
              Ainda não é assinante?{" "}
              <a href="/assinatura" className="text-[#b8944a] hover:underline">Ver planos</a>
            </p>
          </div>
        </div>

        <Link href="/" className="text-[11px] text-gray-700 tracking-wide text-center hover:text-[#b8944a] transition">
          ← Voltar para o site
        </Link>
      </div>
    </div>
  );
}

export default function ClienteLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <IconLoader2 size={28} className="animate-spin text-[#b8944a]" />
      </div>
    }>
      <LoginConteudo />
    </Suspense>
  );
}
