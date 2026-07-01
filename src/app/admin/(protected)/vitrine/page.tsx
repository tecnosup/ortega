"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { Star, Scissors, ShoppingBag } from "lucide-react";
import type { LandingSettings } from "@/lib/admin-settings";
import type { Item } from "@/lib/admin-items";
import type { Produto } from "@/lib/admin-produtos";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full";
const card = "bg-[#111] border border-[#2d2d2d] rounded-lg";

function ImageUpload({ label, name, current, folder }: { label: string; name: string; current: string; folder: string }) {
  const [url, setUrl] = useState(current);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.url) setUrl(data.url);
      else setError(data.error ?? "Erro no upload");
    } catch { setError("Erro de rede"); }
    finally { setUploading(false); }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
      <input type="hidden" name={name} value={url} />
      {url && <img src={url} alt="preview" className="w-full max-w-xs h-24 object-cover rounded border border-[#2d2d2d] mb-1" />}
      <input type="file" accept="image/*" onChange={handleUpload}
        className="text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-gray-400 hover:file:bg-[#252525]" />
      <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ou cole uma URL" className={inp + " mt-1"} />
      {uploading && <span className="text-xs text-gray-500">Enviando...</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export default function VitrinePage() {
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [destaqueId, setDestaqueId] = useState("");
  const [destaqueTipo, setDestaqueTipo] = useState<"servico" | "produto" | "">("");

  const carregar = useCallback(async () => {
    const [resSettings, resItens, resProdutos] = await Promise.all([
      fetch("/api/admin/configuracoes", { credentials: "include" }),
      fetch("/api/admin/itens", { credentials: "include" }),
      fetch("/api/admin/produtos", { credentials: "include" }),
    ]);
    const { settings: s } = await resSettings.json();
    setSettings(s);
    setDestaqueId(s.destaqueId ?? "");
    setDestaqueTipo(s.destaqueTipo ?? "");
    if (resItens.ok) { const d = await resItens.json(); setItens(d.items ?? []); }
    if (resProdutos.ok) { const d = await resProdutos.json(); setProdutos(d.produtos ?? []); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleSalvarDestaque() {
    setSalvando(true); setMsg(null);
    const res = await fetch("/api/admin/configuracoes", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destaqueId, destaqueTipo }),
    });
    setMsg(res.ok ? { ok: true, text: "Destaque salvo!" } : { ok: false, text: "Erro ao salvar." });
    setSalvando(false);
  }

  async function handleSalvarTextos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    const res = await fetch("/api/admin/configuracoes", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMsg(res.ok ? { ok: true, text: "Textos salvos!" } : { ok: false, text: "Erro ao salvar." });
    setSalvando(false);
  }

  if (!settings) return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Carregando...</div>;

  const destaqueAtual = destaqueTipo === "servico"
    ? itens.find((i) => i.id === destaqueId)
    : destaqueTipo === "produto"
    ? produtos.find((p) => p.id === destaqueId)
    : null;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Painel</p>
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Vitrine</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie o que aparece em destaque no site.</p>
      </div>

      {/* ── DESTAQUE ── */}
      <div className={`${card} p-5 flex flex-col gap-4`}>
        <div>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-0.5">Peça em destaque</p>
          <p className="text-xs text-gray-600">Aparece no hero da página inicial. Se nenhum for selecionado, o primeiro serviço publicado é exibido automaticamente.</p>
        </div>

        {destaqueAtual && (
          <div className={`flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0A] border border-[#b8944a]/30`}>
            <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mr-1">Em destaque agora</p>
            {destaqueAtual.imagem && <img src={destaqueAtual.imagem} alt={destaqueAtual.titulo} className="w-12 h-12 object-cover rounded" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#F5E6C8]">{destaqueAtual.titulo}</p>
              <p className="text-xs text-gray-500">{destaqueTipo === "servico" ? "Serviço" : "Produto"}</p>
              <p className="text-sm font-bold text-[#b8944a] mt-0.5">{"preco" in destaqueAtual ? `R$ ${destaqueAtual.preco}` : ""}</p>
            </div>
          </div>
        )}

        {/* seletor tipo */}
        <div className="flex gap-2">
          <button onClick={() => setDestaqueTipo("servico")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition ${destaqueTipo === "servico" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
            <Scissors size={12} /> Serviço
          </button>
          <button onClick={() => setDestaqueTipo("produto")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition ${destaqueTipo === "produto" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
            <ShoppingBag size={12} /> Produto
          </button>
        </div>

        {/* grade de seleção */}
        {destaqueTipo !== "" && (
          <div>
            <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-3 text-center">Selecione</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(destaqueTipo === "servico" ? itens : produtos)
                .filter((i) => i.status === "published")
                .map((item) => {
                  const selected = item.id === destaqueId;
                  return (
                    <button key={item.id} onClick={() => setDestaqueId(item.id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition text-left ${selected ? "border-[#b8944a]" : "border-[#2d2d2d] hover:border-[#555]"}`}>
                      {item.imagem
                        ? <img src={item.imagem} alt={item.titulo} className="w-full h-28 object-cover" />
                        : <div className="w-full h-28 bg-[#1a1a1a] flex items-center justify-center"><Star size={20} className="text-gray-600" /></div>
                      }
                      <div className="p-2">
                        <p className="text-xs font-semibold text-[#F5E6C8] truncate">{item.titulo}</p>
                        <p className="text-xs text-[#b8944a]">R$ {item.preco}</p>
                      </div>
                      {selected && (
                        <div className="absolute top-2 right-2 bg-[#b8944a] rounded-full p-0.5">
                          <Star size={10} className="text-[#0A0A0A] fill-[#0A0A0A]" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {msg && <p className={`text-xs ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>}

        <button onClick={handleSalvarDestaque} disabled={salvando || destaqueTipo === "" || destaqueId === ""}
          className="px-5 py-2 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-40 w-fit">
          {salvando ? "Salvando..." : "Salvar destaque"}
        </button>
      </div>

      {/* ── TEXTOS DA LANDING ── */}
      <div className="border-t border-[#2d2d2d] pt-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Textos da landing</p>
      </div>

      <form onSubmit={handleSalvarTextos} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Título do hero</label>
          <input name="heroTitulo" defaultValue={settings.heroTitulo} spellCheck={false} className={inp} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Subtítulo do hero</label>
          <input name="heroSubtitulo" defaultValue={settings.heroSubtitulo} spellCheck={false} className={inp} required />
        </div>
        <ImageUpload label="Imagem de fundo do hero" name="heroImagemFundo" current={settings.heroImagemFundo} folder="ortega/hero" />
        <ImageUpload label="Foto retrato do hero" name="heroImagemRetrato" current={settings.heroImagemRetrato} folder="ortega/hero" />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Texto sobre nós</label>
          <textarea name="sobreTexto" rows={4} defaultValue={settings.sobreTexto} className={`${inp} resize-none`} required />
        </div>
        <ImageUpload label="Foto da seção Sobre Nós" name="sobreImagem" current={settings.sobreImagem} folder="ortega/sobre" />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">WhatsApp (com DDI, ex: 5511999999999)</label>
          <input name="whatsappNumber" defaultValue={settings.whatsappNumber} spellCheck={false} className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">E-mail de contato</label>
          <input name="emailContato" type="email" defaultValue={settings.emailContato} spellCheck={false} className={inp} />
        </div>

        {msg && <p className={`text-xs ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>}

        <button type="submit" disabled={salvando}
          className="px-6 py-2.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition w-fit disabled:opacity-50">
          {salvando ? "Salvando..." : "Salvar textos"}
        </button>
      </form>
    </div>
  );
}
