"use client";

export const dynamic = "force-dynamic";

import { useActionState, useEffect, useState } from "react";
import { saveConfiguracoesAction } from "./actions";
import type { LandingSettings } from "@/lib/admin-settings";
import { Clock, Hand, Zap, Settings } from "lucide-react";

type AutoConfirmMode = "manual" | "tempo" | "automatico";

const modos: { value: AutoConfirmMode; label: string; desc: string; icon: typeof Hand }[] = [
  { value: "manual",     label: "Manual",           desc: "Você confirma cada agendamento na mão.",                 icon: Hand },
  { value: "tempo",      label: "Após X minutos",   desc: "Confirma sozinho se você não revisar dentro do tempo.",  icon: Clock },
  { value: "automatico", label: "Automático total", desc: "Todo agendamento já entra confirmado, sem revisão.",     icon: Zap },
];

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [state, formAction, pending] = useActionState(saveConfiguracoesAction, null);

  const [mode, setMode] = useState<AutoConfirmMode>("manual");
  const [minutos, setMinutos] = useState(20);

  useEffect(() => {
    fetch("/api/admin/configuracoes")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        setMode(d.settings.autoConfirmMode ?? "manual");
        setMinutos(d.settings.autoConfirmMinutos ?? 20);
      });
  }, []);

  if (!settings) return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F5E6C8] flex items-center gap-2">
          <Settings size={22} className="text-[#b8944a]" /> Configurações
        </h1>
        <p className="text-sm text-gray-500 mt-1">Ajustes de funcionamento do sistema.</p>
      </div>

      <form action={formAction}>
        {/* ── Confirmação de agendamento ── */}
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#F5E6C8]">Confirmação de agendamento</h2>
            <p className="text-xs text-gray-500 mt-0.5">Como novos agendamentos feitos pelo cliente são confirmados.</p>
          </div>

          {/* input escondido que envia o modo escolhido */}
          <input type="hidden" name="autoConfirmMode" value={mode} />

          <div className="flex flex-col gap-2">
            {modos.map(({ value, label, desc, icon: Icon }) => {
              const ativo = mode === value;
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setMode(value)}
                  className={`flex items-start gap-3 text-left px-4 py-3 rounded-lg border transition ${
                    ativo
                      ? "border-[#b8944a] bg-[#b8944a]/10"
                      : "border-[#2d2d2d] bg-[#0A0A0A] hover:border-[#3d3d3d]"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${ativo ? "bg-[#b8944a]/20" : "bg-[#1a1a1a]"}`}>
                    <Icon size={16} className={ativo ? "text-[#b8944a]" : "text-gray-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${ativo ? "text-[#b8944a]" : "text-gray-300"}`}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${ativo ? "border-[#b8944a] bg-[#b8944a]" : "border-[#3d3d3d]"}`}>
                    {ativo && <div className="w-full h-full rounded-full bg-[#0A0A0A] scale-[0.4]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* campo de minutos — só no modo tempo */}
          <div className={`flex items-center gap-2 transition ${mode === "tempo" ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
            <label className="text-xs text-gray-400">Confirmar após</label>
            <input
              name="autoConfirmMinutos"
              type="number"
              min={1}
              max={1440}
              value={minutos}
              onChange={(e) => setMinutos(Math.max(1, Number(e.target.value) || 1))}
              className="bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-20 text-center"
            />
            <label className="text-xs text-gray-400">minutos sem revisão</label>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition w-fit disabled:opacity-50"
            >
              {pending ? "Salvando..." : "Salvar"}
            </button>
            {state?.ok === false && <p className="text-sm text-red-400">{state.error}</p>}
            {state?.ok === true && <p className="text-sm text-green-400">Configurações salvas!</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
