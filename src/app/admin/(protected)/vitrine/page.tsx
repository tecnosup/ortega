"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import {
  IconScissors, IconShoppingBag, IconStar, IconPhoto, IconEye, IconCalendarSearch,
} from "@tabler/icons-react";
import type { LandingSettings } from "@/lib/admin-settings";
import type { Item } from "@/lib/admin-items";
import type { Produto } from "@/lib/admin-produtos";
import { useSucesso } from "@/components/ui/Sucesso";
import { useToast } from "@/components/ui/Toast";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full";
const card = "bg-[#111] border border-[#2d2d2d] rounded-lg";

function ImageUpload({ label, name, current, folder, onUrlChange }: { label: string; name: string; current: string; folder: string; onUrlChange?: (url: string) => void }) {
  const [url, setUrlState] = useState(current);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imgQuebrada, setImgQuebrada] = useState(false);

  // setUrl centralizado: atualiza estado local E notifica o pai (para o preview)
  function setUrl(v: string) { setUrlState(v); onUrlChange?.(v); }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.url) { setUrl(data.url); setImgQuebrada(false); }
      else setError(data.error ?? "Erro no upload");
    } catch { setError("Erro de rede"); }
    finally { setUploading(false); }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
      <input type="hidden" name={name} value={url} />
      {/* preview com estado: carregando (skeleton), quebrada (placeholder) ou ok */}
      <div className="relative w-full max-w-xs h-24 mb-1">
        {uploading ? (
          <div className="skeleton w-full h-full rounded border border-[#2d2d2d]" />
        ) : url && !imgQuebrada ? (
          <img src={url} alt="preview" onError={() => setImgQuebrada(true)}
            className="w-full h-full object-cover rounded border border-[#2d2d2d]" />
        ) : (
          <div className="w-full h-full rounded border border-dashed border-[#2d2d2d] bg-[#0A0A0A] flex flex-col items-center justify-center gap-1 text-gray-600">
            <IconPhoto size={20} />
            <span className="text-[10px]">{url ? "Imagem não carregou" : "Sem imagem"}</span>
          </div>
        )}
      </div>
      <input type="file" accept="image/*" onChange={handleUpload}
        className="text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-gray-400 hover:file:bg-[#252525]" />
      <input type="text" value={url} onChange={(e) => { setUrl(e.target.value); setImgQuebrada(false); }} placeholder="ou cole uma URL" className={inp + " mt-1"} />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// Cena do hero (réplica fiel: fundo 30% + duplo gradiente, grain, linha dourada,
// título Playfair, traço+tesoura, botões, retrato lateral com molduras).
function HeroCena({ titulo, subtitulo, fundo, retrato, destaque }: { titulo: string; subtitulo: string; fundo: string; retrato: string; destaque?: { titulo: string; preco: string; imagem: string } | null }) {
  return (
    <div className="relative w-full h-full bg-[#0A0A0A] overflow-hidden">
      {fundo
        ? <img src={fundo} alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-30 scale-110" />
        : <div className="absolute inset-0 bg-[#141414]" />}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-[#0A0A0A]/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/60" />
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "100px",
      }} />
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#C9A84C]/40 to-transparent" />
      <div className="relative z-10 h-full flex items-center px-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[6px] font-medium tracking-[0.25em] uppercase">Barbearia Premium</span>
          </div>
          <p className="text-2xl font-bold text-[#F5E6C8] leading-[1.05] tracking-tight mt-1 line-clamp-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {titulo || "Título do hero"}
          </p>
          <p className="text-[10px] max-w-[220px] text-[#F5E6C8]/50 mt-1 leading-snug line-clamp-2">
            {subtitulo || "Subtítulo do hero aparece aqui."}
          </p>
          <div className="flex items-center gap-1 w-20 my-1.5">
            <span className="flex-1 h-px bg-[#C9A84C]/40" />
            <IconScissors size={8} className="text-[#C9A84C] shrink-0" />
            <span className="flex-1 h-px bg-[#C9A84C]/40" />
          </div>
          <div className="flex gap-1">
            <span className="px-2 py-0.5 bg-[#C9A84C] text-[#0A0A0A] text-[6px] font-black tracking-widest uppercase text-center">Agendar</span>
            <span className="px-2 py-0.5 border border-[#C9A84C] text-[#C9A84C] text-[6px] font-bold tracking-wider uppercase text-center">WhatsApp</span>
          </div>
          {/* réplica do botão "Já agendou? Ver meu status" do hero real */}
          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] text-[6px] text-[#F5E6C8]/80">
            <IconCalendarSearch size={7} className="text-[#C9A84C] shrink-0" />
            <span>Já agendou? <span className="font-semibold text-[#C9A84C]">Ver meu status</span> →</span>
          </span>
        </div>
        {retrato && (
          <div className="relative w-14 h-24 shrink-0 ml-3">
            <div className="absolute -inset-1 border border-[#C9A84C]/20" />
            <div className="relative w-full h-full overflow-hidden">
              <img src={retrato} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/70 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r border-b border-[#C9A84C]/50" />
            <div className="absolute -top-1 -left-1 w-3 h-3 border-l border-t border-[#C9A84C]/50" />
            {/* card de destaque sobre o retrato (fiel ao hero real no desktop) */}
            {destaque && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[92%] bg-[#0A0A0A]/95 border border-[#C9A84C]/40 px-1 py-0.5 flex items-center gap-1">
                {destaque.imagem
                  ? <img src={destaque.imagem} alt={destaque.titulo} className="w-3.5 h-3.5 object-cover rounded shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded bg-[#141414] flex items-center justify-center shrink-0"><IconStar size={7} className="text-gray-600" /></div>}
                <div className="min-w-0 flex-1 leading-none">
                  <p className="text-[#C9A84C] text-[4px] tracking-[0.2em] uppercase font-medium">Em destaque</p>
                  <p className="text-[#F5E6C8] text-[6px] font-semibold truncate">{destaque.titulo}</p>
                  {destaque.preco && <p className="text-[#C9A84C] text-[5px] font-bold">R$ {destaque.preco}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Moldura de MONITOR reutilizável: barra de janela + tela + pezinho.
// Envolve qualquer cena de preview (hero, sobre, destaque) pra dar o mesmo
// enquadramento "como aparece no computador". Legenda opcional.
function MockupComputador({ children, legenda = "Prévia (como aparece no site)" }: { children: React.ReactNode; legenda?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        <IconEye size={12} /> {legenda}
      </span>
      <div className="flex justify-center bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg p-3 sm:p-4">
        <div className="w-full max-w-[420px] min-w-0 flex flex-col items-center">
          <div className="w-full rounded-md border border-[#3d3d3d] bg-[#1a1a1a] overflow-hidden shadow-lg">
            <div className="h-3.5 bg-[#141414] border-b border-[#2d2d2d] flex items-center gap-0.5 px-2">
              <span className="w-1 h-1 rounded-full bg-[#3d3d3d]" />
              <span className="w-1 h-1 rounded-full bg-[#3d3d3d]" />
              <span className="w-1 h-1 rounded-full bg-[#3d3d3d]" />
            </div>
            <div className="aspect-[16/9]">{children}</div>
          </div>
          <div className="w-10 h-1 bg-[#2d2d2d] rounded-b" />
          <div className="w-16 h-0.5 bg-[#2d2d2d] rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Mini-preview do hero num mockup de computador. Atualiza ao vivo. Sem animações.
function HeroPreview({ titulo, subtitulo, fundo, retrato, destaque }: { titulo: string; subtitulo: string; fundo: string; retrato: string; destaque?: { titulo: string; preco: string; imagem: string } | null }) {
  return (
    <MockupComputador>
      <HeroCena titulo={titulo} subtitulo={subtitulo} fundo={fundo} retrato={retrato} destaque={destaque} />
    </MockupComputador>
  );
}

// Cena da seção "Sobre" (réplica: imagem à esquerda com bordas douradas, texto
// à direita com "Nossa história"), no enquadramento da tela.
function SobreCena({ texto, imagem }: { texto: string; imagem: string }) {
  return (
    <div className="relative w-full h-full bg-[#0A0A0A] grid grid-cols-2 gap-4 items-center px-5 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />
      <div className="relative h-[70%] border border-[#C9A84C]/20 overflow-hidden">
        {imagem
          ? <img src={imagem} alt="" className="w-full h-full object-cover opacity-80" />
          : <div className="w-full h-full bg-[#141414] flex items-center justify-center"><IconPhoto size={18} className="text-gray-600" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 to-transparent" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r border-b border-[#C9A84C]/40" />
        <div className="absolute -top-1 -left-1 w-4 h-4 border-l border-t border-[#C9A84C]/40" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-px bg-[#C9A84C]" />
          <span className="text-[#C9A84C] text-[6px] font-medium tracking-[0.25em] uppercase">Nossa história</span>
        </div>
        <p className="text-[9px] text-[#F5E6C8]/70 leading-snug mt-1.5 line-clamp-5">{texto || "O texto sobre a barbearia aparece aqui."}</p>
      </div>
    </div>
  );
}

function SobrePreview({ texto, imagem }: { texto: string; imagem: string }) {
  return (
    <MockupComputador>
      <SobreCena texto={texto} imagem={imagem} />
    </MockupComputador>
  );
}

// Cena do destaque: o hero de fundo (esmaecido) com o card de destaque sobre o
// retrato — mostra ONDE a peça aparece, não só o card solto.
function DestaqueCena({ titulo, preco, imagem }: { titulo: string; preco: string; imagem: string }) {
  return (
    <div className="relative w-full h-full bg-[#0A0A0A] overflow-hidden flex items-center justify-end px-5">
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/90 to-[#0A0A0A]/60" />
      {/* card de destaque, como aparece no canto do hero */}
      <div className="relative z-10 w-[62%] bg-[#0A0A0A]/95 border border-[#C9A84C]/40 px-3 py-2 flex items-center gap-2 rounded">
        {imagem
          ? <img src={imagem} alt={titulo} className="w-9 h-9 object-cover rounded shrink-0" />
          : <div className="w-9 h-9 rounded bg-[#141414] flex items-center justify-center shrink-0"><IconStar size={12} className="text-gray-600" /></div>}
        <div className="min-w-0 flex-1">
          <p className="text-[#C9A84C] text-[6px] tracking-[0.25em] uppercase font-medium">Em destaque</p>
          <p className="text-[#F5E6C8] text-[11px] font-semibold truncate leading-tight">{titulo}</p>
          {preco && <p className="text-[#C9A84C] text-[9px] font-bold">R$ {preco}</p>}
        </div>
      </div>
    </div>
  );
}

function DestaquePreview({ titulo, preco, imagem }: { titulo: string; preco: string; imagem: string }) {
  return (
    <MockupComputador legenda="Prévia do destaque no site">
      <DestaqueCena titulo={titulo} preco={preco} imagem={imagem} />
    </MockupComputador>
  );
}

export default function VitrinePage() {
  const sucesso = useSucesso();
  const toast = useToast();
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [destaqueId, setDestaqueId] = useState("");
  const [destaqueTipo, setDestaqueTipo] = useState<"servico" | "produto" | "">("");
  const [destaqueAtivo, setDestaqueAtivo] = useState(false);

  // espelho ao vivo dos campos p/ os mini-previews (antes de salvar)
  const [prev, setPrev] = useState({ titulo: "", subtitulo: "", fundo: "", retrato: "", sobreTexto: "", sobreImagem: "" });
  const setPrevCampo = (campo: keyof typeof prev) => (v: string) => setPrev((p) => ({ ...p, [campo]: v }));

  const carregar = useCallback(async () => {
    const [resSettings, resItens, resProdutos] = await Promise.all([
      fetch("/api/admin/configuracoes", { credentials: "include" }),
      fetch("/api/admin/itens", { credentials: "include" }),
      fetch("/api/admin/produtos", { credentials: "include" }),
    ]);
    const jSettings = resSettings.ok ? await resSettings.json().catch(() => ({})) : {};
    const s = jSettings.settings;
    if (s) {
      setSettings(s);
      setDestaqueId(s.destaqueId ?? "");
      setDestaqueTipo(s.destaqueTipo ?? "");
      setDestaqueAtivo(s.destaqueAtivo ?? false);
      setPrev({
        titulo: s.heroTitulo ?? "",
        subtitulo: s.heroSubtitulo ?? "",
        fundo: s.heroImagemFundo ?? "",
        retrato: s.heroImagemRetrato ?? "",
        sobreTexto: s.sobreTexto ?? "",
        sobreImagem: s.sobreImagem ?? "",
      });
    }
    if (resItens.ok) { const d = await resItens.json(); setItens(d.items ?? []); }
    if (resProdutos.ok) { const d = await resProdutos.json(); setProdutos(d.produtos ?? []); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleSalvarDestaque() {
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/configuracoes", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destaqueId, destaqueTipo, destaqueAtivo }),
      });
      if (res.ok) sucesso("Destaque salvo!");
      else toast.erro("Erro ao salvar o destaque.");
    } catch {
      toast.erro("Erro de rede ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarTextos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    try {
      const res = await fetch("/api/admin/configuracoes", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) sucesso("Textos salvos!");
      else toast.erro("Erro ao salvar os textos.");
    } catch {
      toast.erro("Erro de rede ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (!settings) return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-7 w-40 rounded" />
      </div>
      <div className="skeleton h-48 rounded-lg" />
      <div className="skeleton h-64 rounded-lg" />
    </div>
  );

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium tracking-widest uppercase text-gray-500 mb-0.5">Peça em destaque</p>
            <p className="text-xs text-gray-600">Quando ativo, aparece em destaque no topo do site (hero), com foto, nome e preço.</p>
          </div>
          {/* toggle liga/desliga */}
          <button type="button" onClick={() => setDestaqueAtivo((v) => !v)}
            role="switch" aria-checked={destaqueAtivo}
            className={`relative shrink-0 w-11 h-6 rounded-full transition ${destaqueAtivo ? "bg-[#b8944a]" : "bg-[#2d2d2d]"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${destaqueAtivo ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {!destaqueAtivo && (
          <p className="text-xs text-gray-600 -mt-1">Desativado — o topo do site mostra o selo padrão "Desde 2026".</p>
        )}

        {/* conteúdo retrátil: expande ao ligar o toggle, recolhe ao desligar */}
        <div className="collapse-anim" data-open={destaqueAtivo}>
          <div className="flex flex-col gap-4">
            {/* mini-preview de como o destaque aparece no hero */}
            {destaqueAtual && (
              <DestaquePreview titulo={destaqueAtual.titulo} preco={"preco" in destaqueAtual ? destaqueAtual.preco : ""} imagem={destaqueAtual.imagem} />
            )}

            {/* seletor tipo */}
            <div className="flex gap-2">
              <button onClick={() => setDestaqueTipo("servico")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition ${destaqueTipo === "servico" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
                <IconScissors size={12} /> Serviço
              </button>
              <button onClick={() => setDestaqueTipo("produto")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition ${destaqueTipo === "produto" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-400 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
                <IconShoppingBag size={12} /> Produto
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
                            : <div className="w-full h-28 bg-[#1a1a1a] flex items-center justify-center"><IconStar size={20} className="text-gray-600" /></div>
                          }
                          <div className="p-2">
                            <p className="text-xs font-semibold text-[#F5E6C8] truncate">{item.titulo}</p>
                            <p className="text-xs text-[#b8944a]">R$ {item.preco}</p>
                          </div>
                          {selected && (
                            <div className="absolute top-2 right-2 bg-[#b8944a] rounded-full p-0.5">
                              <IconStar size={10} className="text-[#0A0A0A] fill-[#0A0A0A]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ligado exige uma peça escolhida; desligado pode salvar sempre (p/ desativar) */}
        <button onClick={handleSalvarDestaque} disabled={salvando || (destaqueAtivo && (destaqueTipo === "" || destaqueId === ""))}
          className="px-5 py-2 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-40 w-fit mx-auto">
          {salvando ? "Salvando..." : "Salvar destaque"}
        </button>
      </div>

      {/* ── TEXTOS DA LANDING ── */}
      <div className="border-t border-[#2d2d2d] pt-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Textos da landing</p>
        <p className="text-xs text-gray-600 mt-0.5">Estes campos aparecem diretamente na página inicial do site.</p>
      </div>

      <form onSubmit={handleSalvarTextos} className="flex flex-col gap-5">
        {/* Seção Hero — topo do site */}
        <div className={`${card} p-5 flex flex-col gap-4`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-[#b8944a]">Topo do site (Hero)</p>

          {/* mini-preview ao vivo do hero — reflete o que está sendo editado
              ANTES de salvar. Não é o Hero real (sem animações), mas espelha o
              visual: fundo escurecido, título em serifada, subtítulo. */}
          <HeroPreview titulo={prev.titulo} subtitulo={prev.subtitulo} fundo={prev.fundo} retrato={prev.retrato}
            destaque={destaqueAtivo && destaqueAtual
              ? { titulo: destaqueAtual.titulo, preco: "preco" in destaqueAtual ? destaqueAtual.preco : "", imagem: destaqueAtual.imagem }
              : null} />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Título do hero</label>
            <input name="heroTitulo" defaultValue={settings.heroTitulo} onChange={(e) => setPrevCampo("titulo")(e.target.value)} spellCheck={false} className={inp} required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Subtítulo do hero</label>
            <input name="heroSubtitulo" defaultValue={settings.heroSubtitulo} onChange={(e) => setPrevCampo("subtitulo")(e.target.value)} spellCheck={false} className={inp} required />
          </div>
          <ImageUpload label="Imagem de fundo do hero" name="heroImagemFundo" current={settings.heroImagemFundo} folder="ortega/hero" onUrlChange={setPrevCampo("fundo")} />
          <ImageUpload label="Foto retrato do hero" name="heroImagemRetrato" current={settings.heroImagemRetrato} folder="ortega/hero" onUrlChange={setPrevCampo("retrato")} />
        </div>

        {/* Seção Sobre */}
        <div className={`${card} p-5 flex flex-col gap-4`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-[#b8944a]">Seção "Sobre nós"</p>
          <SobrePreview texto={prev.sobreTexto} imagem={prev.sobreImagem} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Texto sobre nós</label>
            <textarea name="sobreTexto" rows={4} defaultValue={settings.sobreTexto} onChange={(e) => setPrevCampo("sobreTexto")(e.target.value)} className={`${inp} resize-none`} required />
          </div>
          <ImageUpload label="Foto da seção Sobre Nós" name="sobreImagem" current={settings.sobreImagem} folder="ortega/sobre" onUrlChange={setPrevCampo("sobreImagem")} />
        </div>

        {/* Seção Contato */}
        <div className={`${card} p-5 flex flex-col gap-4`}>
          <p className="text-[10px] font-medium tracking-widest uppercase text-[#b8944a]">Contato</p>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">WhatsApp (com DDI, ex: 5511999999999)</label>
            <input name="whatsappNumber" defaultValue={settings.whatsappNumber} spellCheck={false} className={inp} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">E-mail de contato</label>
            <input name="emailContato" type="email" defaultValue={settings.emailContato} spellCheck={false} className={inp} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Instagram (URL completa, ex: https://instagram.com/ortegabarber)</label>
            <input name="instagramUrl" defaultValue={settings.instagramUrl} placeholder="https://instagram.com/seuperfil" spellCheck={false} className={inp} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Endereço</label>
            <input name="enderecoTexto" defaultValue={settings.enderecoTexto} placeholder="Rua, número — Bairro, Cidade" spellCheck={false} className={inp} />
            <span className="text-[11px] text-gray-500">Aparece no rodapé e o mapa da página é gerado automaticamente a partir dele.</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Mapa — link de embed (opcional)</label>
            <input name="enderecoEmbed" defaultValue={settings.enderecoEmbed} placeholder="Deixe vazio para usar o endereço acima" spellCheck={false} className={inp} />
            <span className="text-[11px] text-gray-500">Só preencha se quiser fixar um embed específico do Google Maps. Em branco, o mapa segue o endereço.</span>
          </div>
        </div>

        <button type="submit" disabled={salvando}
          className="px-6 py-2.5 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition w-fit mx-auto disabled:opacity-50">
          {salvando ? "Salvando..." : "Salvar textos"}
        </button>
      </form>
    </div>
  );
}
