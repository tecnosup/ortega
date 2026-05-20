"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { PLANOS_PUBLICOS } from "@/lib/stripe-tipos";
import { Suspense } from "react";

function ConfirmacaoConteudo() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "ok" | "erro">("loading");
  const [dados, setDados] = useState<{ clienteNome: string; planoId: string } | null>(null);

  useEffect(() => {
    if (!sessionId) { setStatus("erro"); return; }
    fetch(`/api/assinatura/confirmacao?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) { setDados(json); setStatus("ok"); }
        else setStatus("erro");
      })
      .catch(() => setStatus("erro"));
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin text-[#b8944a]" />
          <p className="text-sm">Confirmando seu pagamento…</p>
        </div>
      </div>
    );
  }

  if (status === "erro") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="text-center flex flex-col items-center gap-4">
          <XCircle size={48} className="text-red-400" />
          <h1 className="text-xl font-bold text-[#F5E6C8]">Não foi possível confirmar</h1>
          <p className="text-gray-500 text-sm">Entre em contato conosco se o pagamento foi debitado.</p>
          <a href="/assinatura" className="text-[#b8944a] text-sm hover:underline">Voltar aos planos</a>
        </div>
      </div>
    );
  }

  const plano = PLANOS_PUBLICOS.find((p) => p.id === dados?.planoId);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="max-w-md w-full flex flex-col items-center gap-6 text-center">
        <CheckCircle size={56} className="text-green-400" />
        <div>
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Assinatura confirmada!</h1>
          <p className="text-gray-400 mt-1">Bem-vindo, {dados?.clienteNome ?? ""}!</p>
        </div>

        {plano && (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 w-full text-left">
            <p className="text-sm text-gray-500 mb-1">Seu plano</p>
            <p className="font-bold text-[#b8944a] text-lg">{plano.nome}</p>
            <p className="text-sm text-gray-400 mt-1">
              {plano.cortes} corte{plano.cortes > 1 ? "s" : ""} por mês · {plano.precoFormatado}/mês
            </p>
          </div>
        )}

        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 w-full text-left flex flex-col gap-2">
          <p className="text-sm font-medium text-[#F5E6C8]">Como usar seus créditos</p>
          <p className="text-sm text-gray-400">
            Ao agendar pelo site, informe o e-mail ou telefone cadastrado aqui. O sistema vai identificar automaticamente sua assinatura e aplicar o desconto.
          </p>
        </div>

        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 w-full text-left">
          <p className="text-xs text-gray-500 mb-1">Próximo passo</p>
          <p className="text-sm text-[#F5E6C8]">
            Acesse sua área do cliente com o e-mail e senha cadastrados para agendar seus cortes.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <a
            href="/cliente/login?msg=conta-criada"
            className="w-full py-3 bg-[#b8944a] text-[#0A0A0A] font-bold rounded-xl hover:bg-[#c9a84c] transition text-center"
          >
            Entrar na área do cliente
          </a>
          <a href="/" className="text-sm text-gray-500 hover:text-[#b8944a] transition text-center">
            Voltar para o site
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#b8944a]" />
      </div>
    }>
      <ConfirmacaoConteudo />
    </Suspense>
  );
}
