"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { PLANOS_PUBLICOS } from "@/lib/stripe-tipos";
import type { AssinaturaResumo, AssinaturaStatus } from "@/lib/stripe-tipos";

interface AssinanteAdmin extends AssinaturaResumo {
  clienteEmail: string;
  clienteTelefone?: string;
  inicioEm: number;
}

const STATUS_COR: Record<AssinaturaStatus, string> = {
  ativa:        "text-green-400 bg-green-400/10 border-green-400/20",
  inadimplente: "text-red-400 bg-red-400/10 border-red-400/20",
  cancelada:    "text-gray-400 bg-gray-400/10 border-gray-400/20",
  pausada:      "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

function formatarData(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function AssinantesPage() {
  const [assinantes, setAssinantes] = useState<AssinanteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<AssinaturaStatus | "todos">("todos");

  const carregar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/assinantes", { credentials: "include" }).catch(() => null);
    const json = res && res.ok ? await res.json().catch(() => ({})) : {};
    setAssinantes(json.assinaturas ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = filtroStatus === "todos"
    ? assinantes
    : assinantes.filter((a) => a.status === filtroStatus);

  const ativos = assinantes.filter((a) => a.status === "ativa").length;
  const receitaMensal = assinantes
    .filter((a) => a.status === "ativa")
    .reduce((s, a) => {
      const plano = PLANOS_PUBLICOS.find((p) => p.id === a.planoId);
      return s + (plano ? Number(plano.precoFormatado.replace(/[^\d]/g, "")) / 100 : 0);
    }, 0);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CreditCard size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Assinantes</h1>
        </div>
        <button onClick={carregar} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#b8944a] transition">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Assinantes ativos</p>
          <p className="text-3xl font-bold text-[#F5E6C8]">{ativos}</p>
        </div>
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Total de assinantes</p>
          <p className="text-3xl font-bold text-[#F5E6C8]">{assinantes.length}</p>
        </div>
        <div className="bg-[#b8944a]/10 border border-[#b8944a]/30 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-[#b8944a] mb-1">Receita mensal recorrente</p>
          <p className="text-xl font-bold text-[#b8944a]">R$ {receitaMensal.toFixed(2).replace(".", ",")}</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 flex-wrap">
        {(["todos", "ativa", "inadimplente", "cancelada", "pausada"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-3 py-1.5 text-xs rounded-full border transition ${
              filtroStatus === s
                ? "bg-[#b8944a] border-[#b8944a] text-[#0A0A0A] font-bold"
                : "border-[#2d2d2d] text-gray-400 hover:border-[#b8944a] hover:text-[#b8944a]"
            }`}
          >
            {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 size={16} className="animate-spin" /> Carregando…
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum assinante encontrado.</p>
      ) : (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-600 border-b border-[#1a1a1a]">
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Plano</th>
                  <th className="text-center px-4 py-3">Créditos</th>
                  <th className="text-left px-4 py-3">Vencimento</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filtrados.map((a) => {
                  const plano = PLANOS_PUBLICOS.find((p) => p.id === a.planoId);
                  const cor = STATUS_COR[a.status] ?? STATUS_COR.pausada;
                  return (
                    <tr key={a.id} className="hover:bg-[#151515] transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#F5E6C8]">{a.clienteNome}</p>
                        <p className="text-xs text-gray-500">{a.clienteEmail}</p>
                        {a.clienteTelefone && <p className="text-xs text-gray-600">{a.clienteTelefone}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{plano?.nome ?? a.planoId}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[#b8944a] font-bold">{a.cortesRestantes}</span>
                        <span className="text-gray-600">/{a.planoCortesTotal}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatarData(a.proximoVencimento)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cor}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{formatarData(a.inicioEm)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
