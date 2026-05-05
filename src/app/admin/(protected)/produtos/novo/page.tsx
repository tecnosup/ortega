"use client";

export const dynamic = "force-dynamic";

import { useActionState, useState } from "react";
import { createProdutoAction } from "../actions";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition";

export default function NovoProdutoPage() {
  const [state, formAction, pending] = useActionState(createProdutoAction, null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      } else {
        setUploadError(data.error ?? `Erro ${res.status}`);
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Erro de rede");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5E6C8]">Novo produto</h1>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="imagem" value={imageUrl} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Nome *</label>
          <input name="titulo" required placeholder="ex: Pomada Modeladora" className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Descrição</label>
          <textarea name="descricao" rows={3} placeholder="Descrição do produto..." className={`${inp} resize-none`} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Imagem</label>
          {imageUrl && <img src={imageUrl} alt="preview" className="w-32 h-32 object-cover rounded border border-[#2d2d2d] mb-1" />}
          <input type="file" accept="image/*" onChange={handleUpload} className="text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-gray-400 hover:file:bg-[#252525]" />
          {uploading && <span className="text-xs text-gray-500">Enviando...</span>}
          {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Preço</label>
          <input name="preco" placeholder="ex: 45,00" className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Status</label>
          <select name="status" defaultValue="draft" className={inp}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Ordem</label>
          <input name="order" type="number" defaultValue={0} className={inp} />
        </div>

        {state && !state.ok && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending || uploading}
          className="py-3 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar produto"}
        </button>
      </form>
    </div>
  );
}
