"use client";

import { useActionState, useState } from "react";
import type { Produto } from "@/lib/admin-produtos";
import type { Categoria } from "@/lib/admin-categorias";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition font-size-16";

type ActionResult = { ok: false; error: string } | null;
type Action = (_: ActionResult, fd: FormData) => Promise<ActionResult>;

interface Props {
  action: Action;
  produto?: Produto;
  categorias: Categoria[];
  submitLabel: string;
}

function maskPreco(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProdutoForm({ action, produto, categorias, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [imageUrl, setImageUrl] = useState(produto?.imagem ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [preco, setPreco] = useState(produto?.preco ?? "");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setUploadProgress(0);

    try {
      const sigRes = await fetch("/api/admin/upload", { credentials: "include" });
      const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json();

      const fd = new FormData();
      fd.append("file", file);
      fd.append("signature", signature);
      fd.append("timestamp", String(timestamp));
      fd.append("api_key", apiKey);
      fd.append("folder", folder ?? "ortega/produtos");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && data.secure_url) {
            setImageUrl(data.secure_url);
            setUploadProgress(100);
            resolve();
          } else {
            reject(new Error(data.error?.message ?? "Erro no upload"));
          }
        };
        xhr.onerror = () => reject(new Error("Erro de rede"));
        xhr.send(fd);
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {produto && <input type="hidden" name="id" value={produto.id} />}
      <input type="hidden" name="imagem" value={imageUrl} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-400">Nome *</label>
        <input name="titulo" required defaultValue={produto?.titulo} placeholder="ex: Pomada Modeladora" className={inp} style={{ fontSize: 16 }} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-400">Descrição</label>
        <textarea name="descricao" rows={3} defaultValue={produto?.descricao} placeholder="Descrição do produto..." className={`${inp} resize-none`} style={{ fontSize: 16 }} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-400">Imagem</label>
        {imageUrl && (
          <div className="relative w-32 h-32 mb-1">
            <img src={imageUrl} alt="preview" className="w-32 h-32 object-cover rounded border border-[#2d2d2d]" />
            <button type="button" onClick={() => setImageUrl("")} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#111] border border-[#2d2d2d] rounded-full text-gray-400 hover:text-red-400 flex items-center justify-center text-xs transition">✕</button>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleUpload} className="text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-gray-400 hover:file:bg-[#252525]" />
        {uploading && uploadProgress !== null && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-[#2d2d2d] rounded-full overflow-hidden">
              <div className="h-full bg-[#b8944a] transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="text-xs text-gray-500">{uploadProgress}%</span>
          </div>
        )}
        {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Preço</label>
          <input
            name="preco"
            value={preco}
            onChange={(e) => setPreco(maskPreco(e.target.value))}
            placeholder="0,00"
            inputMode="numeric"
            className={inp}
            style={{ fontSize: 16 }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Categoria</label>
          <select name="categoriaId" defaultValue={produto?.categoriaId ?? ""} className={inp} style={{ fontSize: 16 }}>
            <option value="">Sem categoria</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Status</label>
          <select name="status" defaultValue={produto?.status ?? "draft"} className={inp} style={{ fontSize: 16 }}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Ordem</label>
          <input name="order" type="number" defaultValue={produto?.order ?? 0} className={inp} style={{ fontSize: 16 }} />
        </div>
      </div>

      {state && !state.ok && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="py-3 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition disabled:opacity-50"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
