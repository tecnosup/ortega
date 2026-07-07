"use client";

import { useState } from "react";
import { MessageCircle, RefreshCw, X } from "lucide-react";

const SUPORTE = [
  { nome: "Abraão", tel: "12996065673" },
  { nome: "Vitor", tel: "12991037897" },
];

function waLink(tel: string) {
  const msg = encodeURIComponent(
    "Olá, estou com um erro no painel da Ortega e preciso de suporte."
  );
  return `https://wa.me/55${tel}?text=${msg}`;
}

function ModalSuporte({ onFechar }: { onFechar: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={onFechar}>
      <div
        className="relative bg-[#111] border border-[#2d2d2d] rounded-xl p-6 w-full max-w-xs flex flex-col gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onFechar} className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition">
          <X size={16} />
        </button>

        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-[#F5E6C8]">Contatar suporte</h3>
          <p className="text-xs text-gray-500">Escolha um consultor para abrir o WhatsApp.</p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {SUPORTE.map(({ nome, tel }) => (
            <a
              key={nome}
              href={waLink(tel)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg text-[#F5E6C8] text-sm font-medium hover:border-[#b8944a] hover:text-[#b8944a] transition"
            >
              <MessageCircle size={16} className="text-[#b8944a] shrink-0" />
              {nome}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [mostraModal, setMostraModal] = useState(false);

  return (
    <div className="min-h-screen-safe bg-[#0A0A0A] flex items-center justify-center px-6">
      {mostraModal && <ModalSuporte onFechar={() => setMostraModal(false)} />}

      <div className="text-center flex flex-col items-center gap-5 max-w-sm w-full">

        <div className="w-14 h-14 rounded-full bg-red-900/20 border border-red-800/40 flex items-center justify-center">
          <span className="text-red-400 text-2xl font-bold">!</span>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-[#F5E6C8]">Algo deu errado</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Ocorreu um erro inesperado no painel. Tente recarregar a página — na maioria dos casos isso resolve.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Se o problema persistir, entre em contato com o suporte técnico da Tecnosup.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
          <button
            onClick={() => setMostraModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-[#2d2d2d] text-gray-400 text-sm rounded hover:border-green-700 hover:text-green-400 transition"
          >
            <MessageCircle size={14} /> Contatar suporte
          </button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <p className="text-[10px] text-gray-700 font-mono break-all border border-[#1a1a1a] rounded p-2 w-full text-left">
            {error.message}
          </p>
        )}

      </div>
    </div>
  );
}
