"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IconCalendarCheck, IconChevronLeft, IconChevronRight, IconClock, IconLoader2, IconUser,
} from "@tabler/icons-react";
import { toDateKey } from "@/lib/date-utils";

interface Agendamento {
  id: string;
  data: string;
  horario: string;
  cliente: string;
  servico: string;
  preco: string;
  status: string;
  telefone?: string;
}

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  pendente:  { label: "Pendente",  cor: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  concluido: { label: "Concluído", cor: "text-green-400 bg-green-400/10 border-green-400/20" },
  cancelado: { label: "Cancelado", cor: "text-red-400 bg-red-400/10 border-red-400/20" },
};

function addDias(dateKey: string, n: number): string {
  const d = new Date(dateKey + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

function formatarData(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const data = new Date(y, m - 1, d);
  return data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export default function BarbeiroAgendaPage() {
  const hoje = toDateKey(new Date());
  const [dataSel, setDataSel] = useState(hoje);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async (data: string) => {
    setLoading(true);
    const res = await fetch(`/api/barbeiro/agendamentos?data=${data}`, { credentials: "include" });
    if (res.ok) {
      const json = await res.json();
      setAgendamentos(json);
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(dataSel); }, [dataSel, carregar]);

  const ativos = agendamentos.filter((a) => a.status !== "cancelado");
  const concluidos = agendamentos.filter((a) => a.status === "concluido").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconCalendarCheck size={22} className="text-[#b8944a]" />
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Minha Agenda</h1>
      </div>

      {/* Navegação de data */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDataSel((d) => addDias(d, -1))}
          className="p-2 rounded-lg border border-[#2d2d2d] text-gray-400 hover:text-white hover:border-[#b8944a] transition"
        >
          <IconChevronLeft size={16} />
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-[#F5E6C8] capitalize">{formatarData(dataSel)}</p>
          {dataSel === hoje && <p className="text-xs text-[#b8944a]">Hoje</p>}
        </div>

        <button
          onClick={() => setDataSel((d) => addDias(d, 1))}
          className="p-2 rounded-lg border border-[#2d2d2d] text-gray-400 hover:text-white hover:border-[#b8944a] transition"
        >
          <IconChevronRight size={16} />
        </button>
      </div>

      {/* Resumo rápido */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Agendamentos</p>
          <p className="text-3xl font-bold text-[#F5E6C8]">{ativos.length}</p>
        </div>
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Concluídos</p>
          <p className="text-3xl font-bold text-green-400">{concluidos}</p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <IconLoader2 size={16} className="animate-spin" /> Carregando…
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">Nenhum agendamento para este dia</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {agendamentos
            .sort((a, b) => a.horario.localeCompare(b.horario))
            .map((ag) => {
              const st = STATUS_LABEL[ag.status] ?? { label: ag.status, cor: "text-gray-400 bg-gray-400/10 border-gray-400/20" };
              return (
                <div
                  key={ag.id}
                  className={`bg-[#111] border rounded-xl p-4 flex flex-col gap-3 ${ag.status === "cancelado" ? "opacity-50 border-[#1a1a1a]" : "border-[#2d2d2d]"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#b8944a] font-bold">
                      <IconClock size={14} />
                      <span>{ag.horario}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${st.cor}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <IconUser size={13} className="text-gray-500 shrink-0" />
                      <p className="text-sm font-medium text-[#F5E6C8]">{ag.cliente}</p>
                    </div>
                    <p className="text-xs text-gray-400 pl-5">{ag.servico}</p>
                    {ag.telefone && (
                      <a
                        href={`https://wa.me/55${ag.telefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#b8944a] pl-5 hover:underline"
                      >
                        {ag.telefone}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#1a1a1a] pt-2">
                    <span className="text-xs text-gray-500">{ag.preco}</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
