"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { demoSettings } from "@/lib/demo-data";

export default function ConfiguracoesPage() {
  const [values, setValues] = useState({ ...demoSettings });
  const [saved, setSaved] = useState(false);

  function set(field: string, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
  }

  const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full";

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-[#F5E6C8] mb-2">Configurações da landing</h1>
      <p className="text-sm text-[#b8944a] bg-[#b8944a]/10 border border-[#b8944a]/30 rounded px-3 py-2 mb-8">
        Modo demo — as alterações não são persistidas ainda.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {[
          { label: "Título do hero", field: "heroTitulo" },
          { label: "Subtítulo do hero", field: "heroSubtitulo" },
          { label: "WhatsApp (com DDI, ex: 5511999999999)", field: "whatsappNumber" },
          { label: "E-mail de contato", field: "emailContato" },
        ].map(({ label, field }) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
            <input value={(values as Record<string, string>)[field] ?? ""} onChange={(e) => set(field, e.target.value)} className={inp} />
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Texto sobre nós</label>
          <textarea value={values.sobreTexto} onChange={(e) => set("sobreTexto", e.target.value)} rows={4}
            className={`${inp} resize-none`} />
        </div>

        {saved && <p className="text-sm text-green-400">Salvo com sucesso! (demo)</p>}

        <button type="submit" className="px-6 py-2.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition w-fit">
          Salvar configurações
        </button>
      </form>
    </div>
  );
}
