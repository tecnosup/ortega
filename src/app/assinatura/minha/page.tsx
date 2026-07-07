"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, Scissors, Calendar, Scissors as ScissorsIcon, X } from "lucide-react";
import { PLANOS_PUBLICOS } from "@/lib/stripe-tipos";
import type { AssinaturaResumo } from "@/lib/stripe-tipos";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2.5 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition w-full";

const STATUS_INFO: Record<string, { label: string; cor: string; bg: string; icone: React.ReactNode }> = {
  ativa:        { label: "Ativa",        cor: "text-green-400",  bg: "bg-green-950 border-green-800",  icone: <CheckCircle size={14} /> },
  inadimplente: { label: "Inadimplente", cor: "text-red-400",    bg: "bg-red-950 border-red-800",      icone: <XCircle size={14} /> },
  cancelada:    { label: "Cancelada",    cor: "text-gray-400",   bg: "bg-[#1a1a1a] border-[#2d2d2d]", icone: <XCircle size={14} /> },
  pausada:      { label: "Pausada",      cor: "text-yellow-400", bg: "bg-yellow-950 border-yellow-800",icone: <AlertCircle size={14} /> },
};

function formatarData(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function CancelModal({
  assinatura,
  planoNome,
  onConfirm,
  onClose,
  loading,
}: {
  assinatura: AssinaturaResumo;
  planoNome: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <div className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[#F5E6C8] font-semibold">Cancelar assinatura?</h2>
            <p className="text-sm text-gray-400 mt-1">
              Seu <span className="text-[#F5E6C8] font-medium">{planoNome}</span> continuará ativo até{" "}
              <span className="text-[#b8944a]">{formatarData(assinatura.proximoVencimento)}</span>.
              Após essa data, você não será mais cobrado.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#2d2d2d] text-gray-400 text-sm rounded-lg hover:border-gray-500 transition">
            Manter plano
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {loading ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MinhaAssinaturaPage() {
  const [email, setEmail] = useState("");
  const [assinatura, setAssinatura] = useState<AssinaturaResumo | null | undefined>(undefined);
  const [buscando, setBuscando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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
      setShowCancelModal(false);
      setAssinatura(null);
    } else {
      setErro(json.error ?? "Erro ao cancelar");
      setShowCancelModal(false);
    }
  }

  const plano = assinatura ? PLANOS_PUBLICOS.find((p) => p.id === assinatura.planoId) : null;
  const st = assinatura ? (STATUS_INFO[assinatura.status] ?? STATUS_INFO.pausada) : null;

  const creditosUsados = assinatura ? assinatura.planoCortesTotal - assinatura.cortesRestantes : 0;
  const pct = assinatura ? Math.round((creditosUsados / assinatura.planoCortesTotal) * 100) : 0;

  return (
    <>
      {showCancelModal && assinatura && plano && (
        <CancelModal
          assinatura={assinatura}
          planoNome={plano.nome}
          onConfirm={cancelar}
          onClose={() => setShowCancelModal(false)}
          loading={cancelando}
        />
      )}

      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full flex flex-col gap-6">

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Scissors size={22} className="text-[#b8944a]" />
              <span className="text-[#b8944a] font-bold tracking-widest uppercase text-sm">Ortega</span>
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
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-6 text-center flex flex-col gap-3">
              <p className="text-gray-400 text-sm">Nenhuma assinatura encontrada para este e-mail.</p>
              <a href="/assinatura" className="inline-block py-2.5 px-5 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded-lg hover:bg-[#c9a84c] transition">
                Ver planos disponíveis
              </a>
            </div>
          )}

          {assinatura && plano && st && (
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden flex flex-col">

              {/* cabeçalho do card */}
              <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#F5E6C8] text-base">{plano.nome}</p>
                  <p className="text-sm text-gray-500">{plano.precoFormatado}/mês · {plano.descricao}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded border ${st.cor} ${st.bg}`}>
                  {st.icone} {st.label}
                </span>
              </div>

              {/* créditos */}
              <div className="p-5 border-b border-[#1a1a1a] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <ScissorsIcon size={14} className="text-[#b8944a]" />
                    Créditos de corte
                  </div>
                  <span className="text-sm font-bold text-[#F5E6C8]">
                    {assinatura.cortesRestantes}
                    <span className="text-gray-600 font-normal"> / {assinatura.planoCortesTotal}</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#b8944a] rounded-full transition-all"
                    style={{ width: `${Math.max(100 - pct, 0)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {assinatura.cortesRestantes === 0
                    ? "Todos os créditos do mês foram utilizados"
                    : `${assinatura.cortesRestantes} corte${assinatura.cortesRestantes > 1 ? "s" : ""} disponível${assinatura.cortesRestantes > 1 ? "is" : ""} este mês`}
                </p>
              </div>

              {/* próxima cobrança */}
              <div className="p-5 border-b border-[#1a1a1a] flex items-center gap-3">
                <Calendar size={16} className="text-gray-600 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Próxima cobrança</p>
                  <p className="text-sm font-medium text-[#F5E6C8]">{formatarData(assinatura.proximoVencimento)}</p>
                </div>
              </div>

              {/* ações */}
              <div className="p-5 flex flex-col gap-3">
                <a
                  href="/agendamento"
                  className="w-full py-3 bg-[#b8944a] text-[#0A0A0A] font-bold rounded-lg hover:bg-[#c9a84c] transition text-center text-sm tracking-wide"
                >
                  Agendar corte
                </a>
                {assinatura.status === "ativa" && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2.5 border border-[#2d2d2d] text-gray-500 hover:text-red-400 hover:border-red-800 rounded-lg transition text-sm"
                  >
                    Cancelar assinatura
                  </button>
                )}
                {assinatura.status === "inadimplente" && (
                  <p className="text-xs text-red-400 text-center">
                    Pagamento pendente. Verifique seu cartão ou entre em contato conosco.
                  </p>
                )}
              </div>
            </div>
          )}

          <a href="/" className="text-center text-xs text-gray-600 hover:text-[#b8944a] transition">
            ← Voltar para o site
          </a>
        </div>
      </div>
    </>
  );
}
