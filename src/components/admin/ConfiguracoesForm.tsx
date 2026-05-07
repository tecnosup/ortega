"use client";

import { useActionState, useState } from "react";
import type { LandingSettings } from "@/lib/admin-settings";
import { updateSettingsAction } from "@/app/admin/(protected)/configuracoes/actions";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition w-full";

function ImageUpload({
  label,
  name,
  current,
  folder,
}: {
  label: string;
  name: string;
  current: string;
  folder: string;
}) {
  const [url, setUrl] = useState(current);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.url) {
        setUrl(data.url);
      } else {
        setError(data.error ?? "Erro no upload");
      }
    } catch {
      setError("Erro de rede");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-400">{label}</label>
      <input type="hidden" name={name} value={url} />
      {url && (
        <img src={url} alt="preview" className="w-full max-w-xs h-28 object-cover rounded border border-[#2d2d2d] mb-1" />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-gray-400 hover:file:bg-[#252525]"
      />
      {url && !uploading && (
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ou cole uma URL"
          className={inp + " mt-1"}
        />
      )}
      {!url && (
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ou cole uma URL"
          className={inp + " mt-1"}
        />
      )}
      {uploading && <span className="text-xs text-gray-500">Enviando...</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export default function ConfiguracoesForm({ settings }: { settings: LandingSettings }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Input label="Título do hero" name="heroTitulo" defaultValue={settings.heroTitulo} required />
      <Input label="Subtítulo do hero" name="heroSubtitulo" defaultValue={settings.heroSubtitulo} required />
      <ImageUpload
        label="Imagem de fundo do hero"
        name="heroImagemFundo"
        current={settings.heroImagemFundo}
        folder="ortega/hero"
      />
      <ImageUpload
        label="Foto retrato do hero (coluna direita)"
        name="heroImagemRetrato"
        current={settings.heroImagemRetrato}
        folder="ortega/hero"
      />
      <Textarea label="Texto sobre nós" name="sobreTexto" defaultValue={settings.sobreTexto} required />
      <ImageUpload
        label="Foto da seção Sobre Nós"
        name="sobreImagem"
        current={settings.sobreImagem}
        folder="ortega/sobre"
      />
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
