"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { demoSettings } from "@/lib/demo-data";

// DEMO MODE: configurações estáticas — conectar ao Firestore na produção
export default function ConfiguracoesPage() {
  const [values, setValues] = useState({ ...demoSettings });
  const [saved, setSaved] = useState(false);

  function set(field: string, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // demo: apenas simula o save
    setSaved(true);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações da landing</h1>
      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-8">
        Modo demo — as alterações não são persistidas. Conecte o Firestore para salvar de verdade.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Título do hero"
          name="heroTitulo"
          value={values.heroTitulo}
          onChange={(e) => set("heroTitulo", e.target.value)}
          required
        />
        <Input
          label="Subtítulo do hero"
          name="heroSubtitulo"
          value={values.heroSubtitulo}
          onChange={(e) => set("heroSubtitulo", e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Texto sobre nós</label>
          <textarea
            value={values.sobreTexto}
            onChange={(e) => set("sobreTexto", e.target.value)}
            rows={4}
            className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:border-[#b8944a]"
          />
        </div>
        <Input
          label="WhatsApp (com DDI, ex: 5511999999999)"
          name="whatsappNumber"
          value={values.whatsappNumber}
          onChange={(e) => set("whatsappNumber", e.target.value)}
        />
        <Input
          label="E-mail de contato"
          name="emailContato"
          type="email"
          value={values.emailContato}
          onChange={(e) => set("emailContato", e.target.value)}
        />

        {saved && <p className="text-sm text-green-600">Salvo com sucesso! (demo)</p>}

        <Button type="submit">Salvar configurações</Button>
      </form>
    </div>
  );
}
