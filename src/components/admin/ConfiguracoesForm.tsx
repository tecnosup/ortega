"use client";

import { useActionState } from "react";
import type { LandingSettings } from "@/lib/admin-settings";
import { updateSettingsAction } from "@/app/admin/(protected)/configuracoes/actions";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

export default function ConfiguracoesForm({ settings }: { settings: LandingSettings }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Input label="Título do hero" name="heroTitulo" defaultValue={settings.heroTitulo} required />
      <Input label="Subtítulo do hero" name="heroSubtitulo" defaultValue={settings.heroSubtitulo} required />
      <Textarea label="Texto sobre nós" name="sobreTexto" defaultValue={settings.sobreTexto} required />
      <Input label="WhatsApp (com DDI, ex: 5511999999999)" name="whatsappNumber" defaultValue={settings.whatsappNumber} />
      <Input label="E-mail de contato" name="emailContato" type="email" defaultValue={settings.emailContato} />

      {state && !state.ok && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">Salvo com sucesso!</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </form>
  );
}
