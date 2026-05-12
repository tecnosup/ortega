"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, Scissors } from "lucide-react";
import { PLANOS_PUBLICOS } from "@/lib/stripe-tipos";
import type { AssinaturaResumo } from "@/lib/stripe-tipos";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2.5 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition w-full";

const STATUS_INFO: Record<string, { label: string; cor: string; icone: React.ReactNode }> = {
  ativa:        { label: "Ativa",        cor: "text-green-400",  icone: <CheckCircle size={16} /> },
  inadimplente: { label: "Inadimplente", cor: "text-red-400",    icone: <XCircle size={16} /> },
  cancelada:    { label: "Cancelada",    cor: "text-gray-400",   icone: <XCircle size={16} /> },
  pausada:      { label: "Pausada",      cor: "text-yellow-400", icone: <AlertCircle size={16} /> },
};

function formatarData(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export default function MinhaAssinaturaPage() {
  const [email, setEmail] = useState("");
  const [assinatura, setAssinatura] = useState<AssinaturaResumo | null | undefined>(undefined);
  const [buscando, setBuscando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");

  async function buscar() {
    if (!email.trim()) { setErro("Informe seu e-mail"); return; }
    setErro("");
    setBuscando(true);
    const res = await fetch(`/api/assinatura/status?email=${encodeURIComponent(email.trim())}`);
    const json = await res.json();
    setAssinatura(json.assinatura ?? null);
    setBuscando(false);
  }

  async function cancelar() {
    if (!confirm("Cancelar assinatura? Você ainda terá acesso até o fim do período pago.")) return;
    setCancelando(true);
    const res = await fetch("/api/assinatura/cancelar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const json = await res.json();
    setCancelando(false);
    if (res.ok) {
      setCancelMsg(`Cancelamento confirmado. Acesso ativo até ${formatarData(json.proximoVencimento)}.`);
      setAssinatura(null);
    } else {
      setErro(json.error ?? "Erro ao cancelar");
    }
  }

  const plano = assinatura ? PLANOS_PUBLICOS.find((p) => p.id === assinatura.planoId) : null;
  const st = assinatura ? (STATUS_INFO[assinatura.status] ?? STATUS_INFO.pausada) : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-5 py-16">
      <div className="max-w-md w-full flex flex-col gap-8">

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Scissors size={22} className="text-[#b8944a]" />
            <span className="text-[#b8944a] font-bold tracking-widest uppercase text-sm">Ortega Barber</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Minha Assinatura</h1>
          <p className="text-sm text-gray-500 mt-1">Digite seu e-mail para consultar</p>
        </div>

        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="seu@email.com"
            className={inp}
            style={{ fontSize: 16 }}
          />
          <button
            onClick={buscar}
            disabled={buscando}
            className="px-4 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded-lg hover:bg-[#c9a84c] transition disabled:opacity-50 shrink-0"
          >
            {buscando ? <Loader2 size={16} className="animate-spin" /> : "Buscar"}
          </button>
        </div>

        {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}
        {cancelMsg && <p className="text-green-400 text-sm text-center">{cancelMsg}</p>}

        {assinatura === null && !cancelMsg && (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm">Nenhuma assinatura ativa encontrada para este e-mail.</p>
            <a href="/assinatura" className="text-[#b8944a] text-sm hover:underline mt-2 block">Ver planos disponíveis</a>
          </div>
        )}

        {assinatura && plano && st && (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl flex flex-col gap-4 overflow-hidden">
            <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#F5E6C8]">{plano.nome}</p>
                <p className="text-sm text-gray-500">{plano.precoFormatado}/mês</p>
              </div>
              <span className={`flex items-center gap-1.5 text-sm font-medium ${st.cor}`}>
                {st.icone} {st.label}
              </span>
            </div>

            <div className="px-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Créditos restantes</p>
                <p className="text-2xl font-bold text-[#b8944a]">
                  {assinatura.cortesRestantes}
                  <span className="text-sm text-gray-500 font-normal"> / {assinatura.planoCortesTotal}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Próxima cobrança</p>
                <p className="text-sm font-medium text-[#F5E6C8]">{formatarData(assinatura.proximoVencimento)}</p>
              </div>
            </div>

            <div className="px-5 pb-5 flex flex-col gap-3">
              <a
                href="/agendamento"
                className="w-full py-3 bg-[#b8944a] text-[#0A0A0A] font-bold rounded-lg hover:bg-[#c9a84c] transition text-center text-sm"
              >
                Agendar corte
              </a>
              {assinatura.status === "ativa" && (
                <button
                  onClick={cancelar}
                  disabled={cancelando}
                  className="w-full py-2.5 border border-[#2d2d2d] text-gray-500 hover:text-red-400 hover:border-red-500 rounded-lg transition text-sm disabled:opacity-50"
                >
                  {cancelando ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                  Cancelar assinatura
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
