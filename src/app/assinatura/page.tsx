"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Check, Loader2, Scissors } from "lucide-react";
import { PLANOS_PUBLICOS } from "@/lib/stripe-tipos";
import type { PlanoAssinaturaPublico } from "@/lib/stripe-tipos";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2.5 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition w-full";

function AssinaturaConteudo() {
  const params = useSearchParams();
  const [planoSel, setPlanoSel] = useState<PlanoAssinaturaPublico | null>(null);

  useEffect(() => {
    const planoId = params.get("plano");
    if (planoId) {
      const encontrado = PLANOS_PUBLICOS.find((p) => p.id === planoId);
      if (encontrado) setPlanoSel(encontrado);
    }
  }, [params]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleAssinar() {
    if (!planoSel) { setErro("Selecione um plano"); return; }
    if (!nome.trim() || !email.trim()) { setErro("Nome e e-mail são obrigatórios"); return; }
    if (senha.length < 6) { setErro("A senha deve ter no mínimo 6 caracteres"); return; }
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/assinatura/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planoId: planoSel.id, nome: nome.trim(), email: email.trim(), telefone, senha }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao criar sessão"); return; }
      window.location.href = json.url;
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5E6C8]">
      <div className="max-w-4xl mx-auto px-5 py-16 flex flex-col gap-14">

        {/* Header */}
        <div className="text-center flex flex-col gap-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Scissors size={28} className="text-[#b8944a]" />
            <span className="text-[#b8944a] font-bold text-xl tracking-widest uppercase">Ortega</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Sempre no estilo.<br />
            <span className="text-[#b8944a]">Todo mês.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Assine um plano e garanta seus cortes com preço fixo, sem precisar pagar na hora.
          </p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANOS_PUBLICOS.map((plano) => {
            const selecionado = planoSel?.id === plano.id;
            const destaque = plano.id === "mensal";
            return (
              <button
                key={plano.id}
                onClick={() => setPlanoSel(plano)}
                className={`relative flex flex-col gap-4 p-6 rounded-2xl border text-left transition-all ${
                  selecionado
                    ? "border-[#b8944a] bg-[#b8944a]/10 shadow-lg shadow-[#b8944a]/10"
                    : destaque
                    ? "border-[#b8944a]/40 bg-[#111]"
                    : "border-[#2d2d2d] bg-[#111] hover:border-[#b8944a]/40"
                }`}
              >
                {destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold px-3 py-1 rounded-full">
                    Mais popular
                  </span>
                )}

                {selecionado && (
                  <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#b8944a] flex items-center justify-center">
                    <Check size={12} className="text-[#0A0A0A]" strokeWidth={3} />
                  </span>
                )}

                <div>
                  <p className="font-bold text-[#F5E6C8] text-lg">{plano.nome}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{plano.descricao}</p>
                </div>

                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-[#b8944a]">{plano.precoFormatado}</span>
                  <span className="text-gray-500 text-sm mb-1">/mês</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check size={14} className="text-[#b8944a]" />
                  <span>{plano.cortes} corte{plano.cortes > 1 ? "s" : ""} por mês</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check size={14} className="text-[#b8944a]" />
                  <span>Desconto automático no agendamento</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check size={14} className="text-[#b8944a]" />
                  <span>Cancele quando quiser</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Formulário */}
        {planoSel && (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl p-7 flex flex-col gap-5 max-w-lg mx-auto w-full">
            <div>
              <h2 className="font-bold text-[#F5E6C8] text-xl">Seus dados</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Assinar: <span className="text-[#b8944a] font-medium">{planoSel.nome} — {planoSel.precoFormatado}/mês</span>
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Nome completo *</span>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João Silva"
                  className={inp}
                  style={{ fontSize: 16 }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">E-mail *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@email.com"
                  className={inp}
                  style={{ fontSize: 16 }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Telefone</span>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(12) 99999-9999"
                  className={inp}
                  style={{ fontSize: 16 }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Crie uma senha para sua área do cliente *</span>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className={inp}
                  style={{ fontSize: 16 }}
                />
              </label>
            </div>

            {erro && <p className="text-red-400 text-sm">{erro}</p>}

            <button
              onClick={handleAssinar}
              disabled={loading}
              className="w-full py-3.5 bg-[#b8944a] text-[#0A0A0A] font-bold rounded-xl hover:bg-[#c9a84c] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Redirecionando…</> : "Assinar agora"}
            </button>

            <p className="text-xs text-gray-600 text-center">
              Pagamento seguro via Stripe. Cobrado mensalmente. Cancele a qualquer momento.
            </p>
          </div>
        )}

        {/* Link para quem já assina */}
        <p className="text-center text-sm text-gray-600">
          Já é assinante?{" "}
          <a href="/assinatura/minha" className="text-[#b8944a] hover:underline">
            Ver minha assinatura
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AssinaturaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#b8944a]" />
      </div>
    }>
      <AssinaturaConteudo />
    </Suspense>
  );
}
