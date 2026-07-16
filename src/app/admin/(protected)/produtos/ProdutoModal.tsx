"use client";

import { useState } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import Modal from "@/components/ui/Modal";
import InputImagem from "@/components/ui/InputImagem";
import Select from "@/components/ui/Select";
import type { Produto } from "@/lib/admin-produtos";
import type { Categoria } from "@/lib/admin-categorias";

const inp = "w-full bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2.5 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition";
const label = "text-[10px] font-semibold tracking-widest uppercase text-gray-500";

// "3550" (dígitos) → "35,50". Máscara de preço em reais.
function maskPreco(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (parseInt(digits, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Modal de criar/editar produto (mesmo padrão dos outros modais do admin).
// `produto` ausente = criação; presente = edição. `onSaved` recebe o produto
// resultante para a lista atualizar in-place sem reload.
export default function ProdutoModal({
  open, produto, categorias, onClose, onSaved,
}: {
  open: boolean;
  produto?: Produto | null;
  categorias: Categoria[];
  onClose: () => void;
  onSaved: (p: Produto) => void;
}) {
  const editando = !!produto;

  const [titulo, setTitulo] = useState(produto?.titulo ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [preco, setPreco] = useState(produto?.preco ?? "");
  const [categoriaId, setCategoriaId] = useState(produto?.categoriaId ?? "");
  const [status, setStatus] = useState<"draft" | "published">(produto?.status ?? "draft");
  const [estoque, setEstoque] = useState(String(produto?.estoque ?? 0));
  const [estoqueMinimo, setEstoqueMinimo] = useState(String(produto?.estoqueMinimo ?? 5));
  const [imagem, setImagem] = useState(produto?.imagem ?? "");
  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErro("");
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("folder", "ortega/produtos");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) setImagem(data.url);
      else setErro(data.error ?? "Erro no upload da imagem");
    } catch { setErro("Erro de rede no upload"); }
    finally { setUploading(false); }
  }

  async function salvar() {
    if (!titulo.trim()) { setErro("Nome obrigatório"); return; }
    setSalvando(true); setErro("");

    const payload = {
      titulo: titulo.trim(), descricao: descricao.trim(), preco: preco.trim(),
      categoriaId: categoriaId || null, status, imagem,
      estoqueMinimo: parseInt(estoqueMinimo, 10) || 0,
      // estoque inicial só na CRIAÇÃO (na edição, estoque é ajustado via card)
      ...(editando ? {} : { estoque: parseInt(estoque, 10) || 0 }),
    };

    try {
      const url = editando ? `/api/admin/produtos/${produto!.id}` : "/api/admin/produtos";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setErro(data?.error ?? "Erro ao salvar"); setSalvando(false); return; }

      const resultante: Produto = {
        id: editando ? produto!.id : data.id,
        titulo: payload.titulo, descricao: payload.descricao, imagem, preco: payload.preco,
        status, order: produto?.order ?? 0,
        categoriaId: categoriaId || undefined,
        estoque: editando ? (produto?.estoque ?? 0) : (parseInt(estoque, 10) || 0),
        estoqueMinimo: payload.estoqueMinimo,
        createdAt: produto?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      onSaved(resultante); // o feedback de sucesso (popup verde) é disparado por quem chama
    } catch {
      setErro("Erro de rede ao salvar");
      setSalvando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[88vh]">
      {/* o ✕ vem do Modal (absolute, top-right) — não desenhar outro aqui */}
      <div className="flex items-center px-5 py-4 border-b border-[#1e1e1e] shrink-0">
        <h3 className="font-bold text-[#F5E6C8] text-sm tracking-wide">{editando ? "Editar produto" : "Novo produto"}</h3>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
        {erro && <p className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded px-3 py-2">{erro}</p>}

        <div className="flex flex-col gap-1.5">
          <label className={label}>Nome *</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="ex: Pomada Modeladora" className={inp} style={{ fontSize: 16 }} spellCheck={false} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label}>Descrição</label>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Descrição do produto..." className={`${inp} resize-none`} style={{ fontSize: 16 }} spellCheck={false} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label}>Imagem</label>
          {imagem && (
            <div className="relative w-24 h-24 mb-1">
              <img src={imagem} alt="preview" className="w-24 h-24 object-cover rounded border border-[#2d2d2d]" />
              <button type="button" onClick={() => setImagem("")} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#111] border border-[#2d2d2d] rounded-full text-gray-400 hover:text-red-400 flex items-center justify-center text-xs transition">✕</button>
            </div>
          )}
          <InputImagem onChange={handleUpload} uploading={uploading} temImagem={!!imagem} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={label}>Preço</label>
            <input value={preco} onChange={(e) => setPreco(maskPreco(e.target.value))} placeholder="0,00" inputMode="numeric" className={inp} style={{ fontSize: 16 }} spellCheck={false} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label}>Categoria</label>
            <Select
              value={categoriaId}
              onChange={setCategoriaId}
              options={[{ value: "", label: "Sem categoria" }, ...categorias.map((c) => ({ value: c.id, label: c.nome }))]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* estoque inicial só na criação (na edição some — ajusta pelo card) */}
          {!editando && (
            <div className="flex flex-col gap-1.5">
              <label className={label}>Estoque inicial</label>
              <input value={estoque} onChange={(e) => setEstoque(e.target.value)} type="number" min={0} className={inp} style={{ fontSize: 16 }} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className={label}>Estoque mínimo</label>
            <input value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} type="number" min={0} className={inp} style={{ fontSize: 16 }} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label}>Status</label>
          <Select
            value={status}
            onChange={(v) => setStatus(v as "draft" | "published")}
            options={[{ value: "draft", label: "Rascunho" }, { value: "published", label: "Publicado" }]}
          />
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[#1e1e1e] flex gap-2 shrink-0">
        <button onClick={salvar} disabled={salvando || uploading} className="flex-1 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-[#c9a84c] transition disabled:opacity-50 flex items-center justify-center gap-1.5">
          {salvando ? <><IconLoader2 size={13} className="animate-spin" /> Salvando...</> : (editando ? "Salvar alterações" : "Criar produto")}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] transition">Cancelar</button>
      </div>
    </Modal>
  );
}
