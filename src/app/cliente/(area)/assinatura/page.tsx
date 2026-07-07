"use client";

import { useState, useEffect } from "react";
import { Scissors, Calendar, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { PLANOS_PUBLICOS } from "@/lib/stripe-tipos";
import type { Assinatura } from "@/lib/assinaturas";
import Modal from "@/components/ui/Modal";

const STATUS_INFO: Record<string, { label: string; cor: string; bg: string; icone: React.ReactNode }> = {
  ativa:        { label: "Ativa",        cor: "text-green-400",  bg: "bg-green-950 border-green-800",  icone: <CheckCircle size={14} /> },
  inadimplente: { label: "Inadimplente", cor: "text-red-400",    bg: "bg-red-950 border-red-800",      icone: <XCircle size={14} /> },
  cancelada:    { label: "Cancelada",    cor: "text-gray-400",   bg: "bg-[#1a1a1a] border-[#2d2d2d]", icone: <XCircle size={14} /> },
  pausada:      { label: "Pausada",      cor: "text-yellow-400", bg: "bg-yellow-950 border-yellow-800",icone: <AlertCircle size={14} /> },
};

function formatarData(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export default function ClienteAssinaturaPage() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/cliente/perfil")
      .then((r) => r.json())
      .then((d) => { setAssinatura(d.assinatura ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function cancelar() {
    setCancelando(true);
    const res = await fetch("/api/cliente/assinatura/cancelar", { method: "POST" });
    const json = await res.json();
    setCancelando(false);
    setShowModal(false);
    if (res.ok) {
      setMsg(`Cancelamento confirmado. Acesso ativo até ${formatarData(json.proximoVencimento)}.`);
      setAssinatura((prev) => prev ? { ...prev, status: "cancelada" } : prev);
    } else {
      setErro(json.error ?? "Erro ao cancelar");
    }
  }

  const plano = assinatura ? PLANOS_PUBLICOS.find((p) => p.id === assinatura.planoId) : null;
  const st = assinatura ? (STATUS_INFO[assinatura.status] ?? STATUS_INFO.pausada) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#b8944a]" />
      </div>
    );
  }

  return (
    <>
      <Modal open={showModal && !!assinatura && !!plano} onClose={() => setShowModal(false)} overlayClassName="!bg-black/80" className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-[#F5E6C8] font-semibold">Cancelar assinatura?</h2>
              <p className="text-sm text-gray-400 mt-1">
                Seu <span className="text-[#F5E6C8] font-medium">{plano?.nome}</span> continuará ativo até{" "}
                <span className="text-[#b8944a]">{assinatura && formatarData(assinatura.proximoVencimento)}</span>.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-[#2d2d2d] text-gray-400 text-sm rounded-lg hover:border-gray-500 transition">
                Manter plano
              </button>
              <button
                onClick={cancelar}
                disabled={cancelando}
                className="flex-1 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {cancelando ? <Loader2 size={14} className="animate-spin" /> : null}
                {cancelando ? "Cancelando..." : "Confirmar"}
              </button>
            </div>
      </Modal>

      <div className="flex flex-col gap-5">
        <h1 className="text-xl font-bold text-[#F5E6C8]">Minha Assinatura</h1>

        {msg && <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3 text-green-400 text-sm">{msg}</div>}
        {erro && <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 text-red-400 text-sm">{erro}</div>}

        {assinatura && plano && st && (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-[#F5E6C8]">{plano.nome}</p>
                <p className="text-sm text-gray-500">{plano.precoFormatado}/mês · {plano.descricao}</p>
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded border ${st.cor} ${st.bg}`}>
                {st.icone} {st.label}
              </span>
            </div>

            <div className="p-5 border-b border-[#1a1a1a] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Scissors size={14} className="text-[#b8944a]" /> Créditos de corte
                </div>
                <span className="text-sm font-bold text-[#F5E6C8]">
                  {assinatura.cortesRestantes}
                  <span className="text-gray-600 font-normal"> / {assinatura.planoCortesTotal}</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#b8944a] rounded-full"
                  style={{ width: `${Math.max(100 - Math.round(((assinatura.planoCortesTotal - assinatura.cortesRestantes) / assinatura.planoCortesTotal) * 100), 0)}%` }}
                />
              </div>
            </div>

            <div className="p-5 border-b border-[#1a1a1a] flex items-center gap-3">
              <Calendar size={16} className="text-gray-600 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Próxima cobrança</p>
                <p className="text-sm font-medium text-[#F5E6C8]">{formatarData(assinatura.proximoVencimento)}</p>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {assinatura.status === "ativa" && (
                <button
                  onClick={() => setShowModal(true)}
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
              {assinatura.status === "cancelada" && (
                <a href="/assinatura" className="w-full py-2.5 bg-[#b8944a] text-[#0A0A0A] font-bold rounded-lg text-sm text-center hover:bg-[#c9a84c] transition">
                  Ver novos planos
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
