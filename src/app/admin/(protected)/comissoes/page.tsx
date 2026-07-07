"use client";

import { useEffect, useState, useCallback } from "react";
import { jsonOr } from "@/lib/safe-json";
import { DollarSign, Loader2, RefreshCw } from "lucide-react";
import type { Barbeiro } from "@/lib/barbeiros-types";
import type { Agendamento } from "@/lib/agendamentos-types";
import { parsePriceNum } from "@/lib/agendamentos-types";
import { toDateKey } from "@/lib/date-utils";

interface ResumoBarb {
  barbeiro: Barbeiro;
  atendimentos: number;
  totalBruto: number;
  totalComissao: number;
}

export default function ComissoesPage() {
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [inicio, setInicio] = useState(toDateKey(primeiroDiaMes));
  const [fim, setFim] = useState(toDateKey(hoje));
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [resBarb, resAgs] = await Promise.all([
      fetch("/api/admin/barbeiros", { credentials: "include" }),
      fetch("/api/agendamentos", { credentials: "include" }),
    ]);
    const bJson = await jsonOr<{ barbeiros?: Barbeiro[] }>(resBarb, {});
    const aJson = await jsonOr<Agendamento[]>(resAgs, []);
    setBarbeiros(bJson.barbeiros ?? []);
    setAgendamentos(Array.isArray(aJson) ? aJson : []);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // filtra por período e status concluido
  const agsFiltrados = agendamentos.filter(
    (a) => a.status === "concluido" && a.data >= inicio && a.data <= fim
  );

  // agrupa por barbeiro
  const resumos: ResumoBarb[] = barbeiros.map((b) => {
    const ags = agsFiltrados.filter((a) => a.barbeiroId === b.id);
    const totalBruto = ags.reduce((s, a) => s + parsePriceNum(a.preco), 0);
    const totalComissao = totalBruto * (b.comissao / 100);
    return { barbeiro: b, atendimentos: ags.length, totalBruto, totalComissao };
  });

  // atendimentos sem barbeiro definido
  const agsSemBarbeiro = agsFiltrados.filter((a) => !a.barbeiroId);

  const totalGeral = resumos.reduce((s, r) => s + r.totalBruto, 0) + agsSemBarbeiro.reduce((s, a) => s + parsePriceNum(a.preco), 0);
  const totalComissoesGeral = resumos.reduce((s, r) => s + r.totalComissao, 0);

  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition";

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <DollarSign size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Comissões</h1>
        </div>
        <button onClick={carregar} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#b8944a] transition">
          <RefreshCw size={14} className={carregando ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

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

      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : barbeiros.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum funcionário cadastrado. <a href="/admin/funcionarios" className="text-[#b8944a] underline">Cadastre funcionários</a> primeiro.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resumos.map((r) => (
              <div key={r.barbeiro.id} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center text-sm font-bold text-[#b8944a] shrink-0">
                    {r.barbeiro.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-[#F5E6C8]">{r.barbeiro.nome}</p>
                    <p className="text-xs text-gray-500">Comissão: <span className="text-[#b8944a]">{r.barbeiro.comissao}%</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-lg p-2">
                    <p className="text-xs text-gray-500">Atendimentos</p>
                    <p className="text-lg font-bold text-[#F5E6C8]">{r.atendimentos}</p>
                  </div>
                  <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-lg p-2">
                    <p className="text-xs text-gray-500">Faturamento</p>
                    <p className="text-sm font-bold text-[#F5E6C8]">R$ {r.totalBruto.toFixed(2).replace(".", ",")}</p>
                  </div>
                  <div className="bg-[#b8944a]/10 border border-[#b8944a]/30 rounded-lg p-2">
                    <p className="text-xs text-[#b8944a]">A pagar</p>
                    <p className="text-sm font-bold text-[#b8944a]">R$ {r.totalComissao.toFixed(2).replace(".", ",")}</p>
                  </div>
                </div>

                {r.atendimentos === 0 && (
                  <p className="text-xs text-gray-600 text-center">Nenhum serviço concluído no período</p>
                )}
              </div>
            ))}
          </div>

          {agsSemBarbeiro.length > 0 && (
            <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5">
              <p className="text-sm font-semibold text-gray-400 mb-2">Sem barbeiro atribuído ({agsSemBarbeiro.length} serviços)</p>
              <p className="text-xs text-gray-600">
                Faturamento: R$ {agsSemBarbeiro.reduce((s, a) => s + parsePriceNum(a.preco), 0).toFixed(2).replace(".", ",")} — comissão não calculada
              </p>
            </div>
          )}

          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total do período</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Atendimentos</p>
                <p className="text-2xl font-bold text-[#F5E6C8]">{agsFiltrados.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Faturamento bruto</p>
                <p className="text-xl font-bold text-[#F5E6C8]">R$ {totalGeral.toFixed(2).replace(".", ",")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total a pagar em comissões</p>
                <p className="text-xl font-bold text-[#b8944a]">R$ {totalComissoesGeral.toFixed(2).replace(".", ",")}</p>
              </div>
            </div>

            {resumos.some((r) => r.atendimentos > 0) && (
              <div className="mt-2 border-t border-[#1a1a1a] pt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-[#1a1a1a]">
                      <th className="text-left pb-2">Barbeiro</th>
                      <th className="text-right pb-2">Atend.</th>
                      <th className="text-right pb-2">Faturamento</th>
                      <th className="text-right pb-2">%</th>
                      <th className="text-right pb-2">Comissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {resumos.filter((r) => r.atendimentos > 0).map((r) => (
                      <tr key={r.barbeiro.id} className="text-[#F5E6C8]">
                        <td className="py-2">{r.barbeiro.apelido ?? r.barbeiro.nome}</td>
                        <td className="text-right py-2">{r.atendimentos}</td>
                        <td className="text-right py-2">R$ {r.totalBruto.toFixed(2).replace(".", ",")}</td>
                        <td className="text-right py-2 text-gray-500">{r.barbeiro.comissao}%</td>
                        <td className="text-right py-2 text-[#b8944a] font-medium">R$ {r.totalComissao.toFixed(2).replace(".", ",")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
