"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, RefreshCw } from "lucide-react";

const STATUS_CONFIG = {
  pendente: {
    label: "Aguardando confirmação",
    cor: "bg-yellow-900/20 border-yellow-600/40 text-yellow-300",
    dot: "bg-yellow-400",
    icone: "⏳",
  },
  confirmado: {
    label: "Confirmado",
    cor: "bg-[#b8944a]/10 border-[#b8944a]/40 text-[#b8944a]",
    dot: "bg-[#b8944a]",
    icone: "✅",
  },
  cancelado: {
    label: "Cancelado",
    cor: "bg-red-900/20 border-red-600/40 text-red-300",
    dot: "bg-red-500",
    icone: "❌",
  },
  concluido: {
    label: "Concluído",
    cor: "bg-green-900/20 border-green-600/40 text-green-300",
    dot: "bg-green-500",
    icone: "✔",
  },
  nao_compareceu: {
    label: "Não compareceu",
    cor: "bg-gray-800 border-gray-600/40 text-gray-400",
    dot: "bg-gray-500",
    icone: "—",
  },
};

const MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia} ${MESES[parseInt(mes) - 1]} ${ano}`;
}

function formatarTelefone(t: string) {
  const d = t.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return t;
}

interface Agendamento {
  id: string;
  servico: string;
  data: string;
  horario: string;
  status: keyof typeof STATUS_CONFIG;
  preco?: string;
  cupom?: string;
  desconto?: number;
  criadoEm: number;
}

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-4 py-3 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition w-full";

function StatusContent() {
  const searchParams = useSearchParams();
  const telParam = searchParams.get("tel") ?? "";

  const [telefone, setTelefone] = useState(telParam);
  const [buscou, setBuscou] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const telefoneRef = useRef(telParam);

  const buscar = useCallback(async (tel: string, silent = false) => {
    if (!silent) setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/publico/agendamentos?telefone=${encodeURIComponent(tel)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao buscar agendamentos");
      setAgendamentos(json.agendamentos);
      setUltimaAtualizacao(new Date());
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-busca se vier com ?tel= na URL
  useEffect(() => {
    if (telParam && telParam.replace(/\D/g, "").length >= 8) {
      telefoneRef.current = telParam;
      setBuscou(true);
      buscar(telParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBuscar(e?: React.FormEvent) {
    e?.preventDefault();
    const tel = telefone.replace(/\D/g, "");
    if (tel.length < 8) { setErro("Digite um telefone válido."); return; }
    telefoneRef.current = telefone;
    setBuscou(true);
    buscar(telefone);
  }

  // Auto-refresh a cada 15s se houver agendamentos pendentes
  useEffect(() => {
    if (!buscou) return;
    const temPendente = agendamentos.some((a) => a.status === "pendente");
    if (temPendente) {
      intervalRef.current = setInterval(() => buscar(telefoneRef.current, true), 15_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [buscou, agendamentos, buscar]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-8 pb-20 px-4">
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 text-gray-500 hover:text-[#b8944a] transition rounded-lg hover:bg-[#1a1a1a]">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#F5E6C8]">Meus Agendamentos</h1>
            <p className="text-xs text-gray-500 mt-0.5">Consulte o status pelo seu telefone</p>
          </div>
        </div>

        {/* Form de busca */}
        <form onSubmit={handleBuscar} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 flex flex-col gap-4">
          <label className="text-sm font-medium text-[#F5E6C8]">Seu telefone (com DDD)</label>
          <input
            className={inp}
            type="tel"
            placeholder="(11) 99999-9999"
            value={telefone}
            onChange={(e) => {
              setTelefone(e.target.value);
              setBuscou(false);
              setAgendamentos([]);
              setErro(null);
            }}
            maxLength={20}
          />
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded-lg hover:bg-[#c9a84c] transition disabled:opacity-50 shadow-[0_0_20px_rgba(184,148,74,0.3)]"
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {loading ? "Buscando..." : "Buscar agendamentos"}
          </button>
        </form>

        {/* Resultados */}
        {buscou && !loading && (
          <div className="flex flex-col gap-3">
            {agendamentos.length === 0 ? (
              <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">Nenhum agendamento encontrado para este telefone.</p>
                <p className="text-gray-600 text-xs mt-2">Verifique se o número está correto.</p>
                <Link
                  href="/agendamento"
                  className="inline-block mt-4 px-5 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded-lg hover:bg-[#c9a84c] transition"
                >
                  Fazer agendamento
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {agendamentos.length} agendamento{agendamentos.length !== 1 ? "s" : ""} • {formatarTelefone(telefoneRef.current)}
                  </p>
                  {ultimaAtualizacao && (
                    <p className="text-xs text-gray-600">
                      Atualizado {ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>

                {agendamentos.map((ag) => {
                  const cfg = STATUS_CONFIG[ag.status] ?? STATUS_CONFIG.pendente;
                  return (
                    <div key={ag.id} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 flex flex-col gap-3">
                      {/* Status badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold w-fit ${cfg.cor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.icone} {cfg.label}
                      </div>

                      {/* Detalhes */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Serviço</p>
                          <p className="text-[#b8944a] font-medium">{ag.servico}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Horário</p>
                          <p className="text-[#F5E6C8]">{ag.horario}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Data</p>
                          <p className="text-[#F5E6C8]">{formatarData(ag.data)}</p>
                        </div>
                        {ag.preco && (
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Valor</p>
                            <p className="text-[#F5E6C8]">
                              R$ {ag.preco}
                              {ag.desconto ? <span className="text-green-400 text-xs ml-1">-{ag.desconto}%</span> : null}
                            </p>
                          </div>
                        )}
                      </div>

                      {ag.status === "pendente" && (
                        <p className="text-xs text-gray-600 border-t border-[#2d2d2d] pt-2">
                          Esta página atualiza automaticamente a cada 15 segundos.
                        </p>
                      )}
                    </div>
                  );
                })}

                <Link
                  href="/agendamento"
                  className="text-center text-sm text-gray-600 hover:text-[#b8944a] transition py-2"
                >
                  + Fazer novo agendamento
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function StatusAgendamentoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#b8944a] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <StatusContent />
    </Suspense>
  );
}
