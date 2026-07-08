"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IconLoader2, IconRefresh, IconTrendingUp,
} from "@tabler/icons-react";
import { toDateKey } from "@/lib/date-utils";

interface Financeiro {
  comissao: number;
  atendimentos: number;
  totalBruto: number;
  totalComissao: number;
  agendamentos: Array<{
    id: string;
    data: string;
    servico: string;
    cliente: string;
    preco: string;
  }>;
}

function moeda(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function BarbeiroFinanceiroPage() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [inicio, setInicio] = useState(toDateKey(primeiroDia));
  const [fim, setFim] = useState(toDateKey(hoje));
  const [dados, setDados] = useState<Financeiro | null>(null);
  const [loading, setLoading] = useState(true);

  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition";

  const carregar = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/barbeiro/financeiro?inicio=${inicio}&fim=${fim}`,
      { credentials: "include" }
    );
    if (res.ok) setDados(await res.json());
    setLoading(false);
  }, [inicio, fim]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <IconTrendingUp size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Meu Financeiro</h1>
        </div>
        <button
          onClick={carregar}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#b8944a] transition"
        >
          <IconRefresh size={14} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {/* Filtro de período */}
      <div className="flex flex-wrap gap-3 items-end bg-[#111] border border-[#2d2d2d] rounded-xl p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">De</span>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={inp} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Até</span>
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className={inp} />
        </label>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <IconLoader2 size={16} className="animate-spin" /> Carregando…
        </div>
      ) : dados ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Atendimentos</p>
              <p className="text-3xl font-bold text-[#F5E6C8]">{dados.atendimentos}</p>
            </div>
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Faturamento</p>
              <p className="text-xl font-bold text-[#F5E6C8]">{moeda(dados.totalBruto)}</p>
            </div>
            <div className="bg-[#b8944a]/10 border border-[#b8944a]/30 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
              <p className="text-xs text-[#b8944a] mb-1">A receber ({dados.comissao}%)</p>
              <p className="text-xl font-bold text-[#b8944a]">{moeda(dados.totalComissao)}</p>
            </div>
          </div>

          {/* Tabela de atendimentos */}
          {dados.agendamentos.length > 0 && (
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#1a1a1a]">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Atendimentos concluídos</p>
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {dados.agendamentos
                  .sort((a, b) => b.data.localeCompare(a.data))
                  .map((ag) => (
                    <div key={ag.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#151515] transition">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm text-[#F5E6C8]">{ag.cliente}</p>
                        <p className="text-xs text-gray-500">{ag.servico} · {ag.data.split("-").reverse().join("/")}</p>
                      </div>
                      <p className="text-sm font-medium text-[#b8944a] shrink-0">{ag.preco}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {dados.atendimentos === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Nenhum atendimento concluído no período</p>
          )}
        </>
      ) : null}
    </div>
  );
}
