"use client";

import { useActionState, useState } from "react";
import type { Item } from "@/lib/admin-items";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

type ActionResult = { ok: false; error: string } | null;

interface ItemFormProps {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  item?: Item;
}

export default function ItemForm({ action, item }: ItemFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const [imageUrl, setImageUrl] = useState(item?.imagem ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setImageUrl(data.url);
    setUploading(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="imagem" value={imageUrl} />

      <Input label="Título" name="titulo" defaultValue={item?.titulo} required />
      <Textarea label="Descrição" name="descricao" defaultValue={item?.descricao} required />
      <Input label="Preço (ex: 55 ou A partir de R$ 120)" name="preco" defaultValue={item?.preco} />
      <Input label="Duração (ex: 45 min)" name="duracao" defaultValue={item?.duracao} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Imagem</label>
        {imageUrl && (
          <img src={imageUrl} alt="preview" className="w-32 h-20 object-cover border border-gray-200 mb-2" />
        )}
        <input type="file" accept="image/*" onChange={handleUpload} className="text-sm text-gray-600" />
        {uploading && <span className="text-xs text-gray-400">Enviando...</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select name="status" defaultValue={item?.status ?? "draft"} className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900">
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
        </select>
      </div>

      <Input label="Ordem" name="order" type="number" defaultValue={item?.order ?? 0} />

      {state && !state.ok && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <Button type="submit" disabled={pending || uploading}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
