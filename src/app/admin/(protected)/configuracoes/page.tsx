"use client";

export const dynamic = "force-dynamic";

import { useActionState, useEffect, useState } from "react";
import { saveConfiguracoesAction } from "./actions";
import type { LandingSettings } from "@/lib/admin-settings";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full";

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [state, formAction, pending] = useActionState(saveConfiguracoesAction, null);

  useEffect(() => {
    fetch("/api/admin/configuracoes")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
  }, []);

  if (!settings) return <p className="text-gray-500 text-sm">Carregando...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-[#F5E6C8] mb-8">Configurações da landing</h1>

      <form action={formAction} className="flex flex-col gap-5">
        {(
          [
            { label: "Título do hero", field: "heroTitulo" },
            { label: "Subtítulo do hero", field: "heroSubtitulo" },
            { label: "WhatsApp (com DDI, ex: 5511999999999)", field: "whatsappNumber" },
            { label: "E-mail de contato", field: "emailContato" },
          ] as { label: string; field: keyof LandingSettings }[]
        ).map(({ label, field }) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
            <input name={field} defaultValue={settings[field]} className={inp} />
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Texto sobre nós</label>
          <textarea name="sobreTexto" rows={4} defaultValue={settings.sobreTexto} className={`${inp} resize-none`} />
        </div>

        {state?.ok === false && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.ok === true && <p className="text-sm text-green-400">Configurações salvas!</p>}

        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition w-fit disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
