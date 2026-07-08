"use client";

import { useState, useEffect } from "react";
import {
  IconLoader2, IconScissors,
} from "@tabler/icons-react";
import type { Agendamento } from "@/lib/agendamentos-types";

const STATUS_INFO: Record<string, { label: string; cor: string }> = {
  pendente:       { label: "Pendente",    cor: "text-yellow-400 bg-yellow-900/20 border-yellow-700/30" },
  confirmado:     { label: "Confirmado",  cor: "text-green-400 bg-green-900/20 border-green-700/30" },
  cancelado:      { label: "Cancelado",   cor: "text-red-400 bg-red-900/20 border-red-700/30" },
  concluido:      { label: "Concluído",   cor: "text-gray-400 bg-[#1a1a1a] border-[#2d2d2d]" },
  nao_compareceu: { label: "Não veio",    cor: "text-orange-400 bg-orange-900/20 border-orange-700/30" },
};

function formatarDataCurta(s: string) {
  const [ano, mes, dia] = s.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function ClienteAgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cliente/agendamentos")
      .then((r) => r.json())
      .then((d) => { setAgendamentos(d.agendamentos ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);
  const futuros = agendamentos.filter((a) => a.data >= hoje && a.status !== "cancelado");
  const passados = agendamentos.filter((a) => a.data < hoje || a.status === "cancelado");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <IconLoader2 size={24} className="animate-spin text-[#b8944a]" />
      </div>
    );
  }

  function AgendamentoCard({ ag }: { ag: Agendamento }) {
    const st = STATUS_INFO[ag.status] ?? STATUS_INFO.pendente;
    return (
      <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-[#F5E6C8]">{ag.servico}</p>
          <p className="text-xs text-gray-500">
            {formatarDataCurta(ag.data)} às {ag.horario}
            {ag.barbeiroNome ? ` · ${ag.barbeiroNome}` : ""}
          </p>
          {ag.preco && (
            <p className="text-xs text-[#b8944a] font-medium mt-0.5">
              R$ {ag.preco}
              {ag.cobertoPorAssinatura && (
                <span className="ml-1.5 text-[10px] text-gray-500 font-normal bg-[#1a1a1a] border border-[#2d2d2d] px-1.5 py-0.5 rounded">
                  Assinatura
                </span>
              )}
            </p>
          )}
        </div>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded border shrink-0 ${st.cor}`}>
          {st.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-[#F5E6C8]">Meus Agendamentos</h1>

      {agendamentos.length === 0 && (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <IconScissors size={28} className="text-gray-700" />
          <p className="text-gray-500 text-sm">Nenhum agendamento ainda</p>
          <a href="/cliente/agendar" className="text-[#b8944a] text-sm hover:underline">Agendar primeiro corte →</a>
        </div>
      )}

      {futuros.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Próximos</h2>
          {futuros.map((ag) => <AgendamentoCard key={ag.id} ag={ag} />)}
        </div>
      )}

      {passados.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Histórico</h2>
          {passados.map((ag) => <AgendamentoCard key={ag.id} ag={ag} />)}
        </div>
      )}
    </div>
  );
}
