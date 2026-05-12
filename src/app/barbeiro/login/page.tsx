"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function BarbeiroLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, senha);
      const idToken = await credential.user.getIdToken(true);

      const res = await fetch("/api/barbeiro/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Sem permissão");
        return;
      }

      router.replace("/barbeiro");
    } catch {
      setErro("E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <span className="text-[#b8944a] font-bold text-xl tracking-widest uppercase block mb-1">
            Ortega Barber
          </span>
          <p className="text-gray-500 text-sm">Portal do Barbeiro</p>
        </div>

        <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl p-7 flex flex-col gap-5">
          <h1 className="text-lg font-bold text-[#F5E6C8]">Entrar</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-400 font-medium">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition"
                style={{ fontSize: 16 }}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-400 font-medium">Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition"
                style={{ fontSize: 16 }}
              />
            </label>

            {erro && <p className="text-red-400 text-sm">{erro}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#b8944a] text-[#0A0A0A] font-bold rounded-lg hover:bg-[#c9a84c] transition disabled:opacity-50 text-sm"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
