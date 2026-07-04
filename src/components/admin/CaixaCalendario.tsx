"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Lock, Unlock, X, Plus, Trash2,
  Wallet, UserPlus, Pencil, Scissors, TrendingDown,
} from "lucide-react";
import type { FechamentoDia, Agendamento, AtendimentoAvulso, ItemAtendimento } from "@/lib/agendamentos-types";
import type { GastoDia } from "@/lib/gastos-dia-tipos";
import { parsePriceNum } from "@/lib/agendamentos-types";

function brl(v: number) { return `R$ ${v.toFixed(2).replace(".", ",")}` }
function toDataStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-1.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] w-full";

// ── Modal ─────────────────────────────────────────────────────────────────────
function ModalConfirm({ titulo, mensagem, confirmLabel, confirmClass, onConfirm, onCancel }: {
  titulo: string; mensagem: string; confirmLabel: string;
  confirmClass: string; onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={onCancel}>
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-[#F5E6C8]">{titulo}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{mensagem}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded hover:border-[#b8944a] transition">Cancelar</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm rounded transition ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Form despesa do dia ───────────────────────────────────────────────────────
type CategoriaSimples = { id: string; nome: string; cor: string };

function FormGastoDia({ data, onSalvo, onCancelar }: {
  data: string; onSalvo: () => void; onCancelar: () => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [categorias, setCategorias] = useState<CategoriaSimples[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/gastos/categorias", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setCategorias)
      .catch(() => {});
  }, []);

  const catSel = categorias.find((c) => c.id === categoriaId);

  async function salvar() {
    if (!descricao.trim()) { setErro("Descrição obrigatória"); return; }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro("Valor inválido"); return; }
    setSalvando(true);
    const body: Record<string, unknown> = { data, descricao, valor: Number(valor) };
    if (catSel) { body.categoriaId = catSel.id; body.categoriaNome = catSel.nome; body.categoriaCor = catSel.cor; }
    const res = await fetch("/api/gastos-dia", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSalvando(false);
    if (res.ok) onSalvo();
    else setErro("Erro ao salvar");
  }

  return (
    <div className="bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg p-4 flex flex-col gap-3 mt-2">
      <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Despesa do dia</p>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Produto comprado, material..." className={inp} />
      <input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor (R$)" className={inp} />
      {categorias.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase">Categoria</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCategoriaId("")}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${!categoriaId ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-[#2d2d2d] text-gray-500 hover:border-gray-500"}`}>
              Sem categoria
            </button>
            {categorias.map((c) => (
              <button key={c.id} onClick={() => setCategoriaId(c.id)}
                style={categoriaId === c.id ? { borderColor: c.cor, color: c.cor, backgroundColor: `${c.cor}15` } : {}}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${categoriaId === c.id ? "" : "border-[#2d2d2d] text-gray-400 hover:border-gray-500"}`}>
                {c.nome}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={salvar} disabled={salvando} className="px-4 py-1.5 bg-red-900/50 border border-red-800/60 text-red-300 text-xs font-bold rounded hover:bg-red-900/70 transition disabled:opacity-50">
          {salvando ? "Salvando..." : "Registrar despesa"}
        </button>
        <button onClick={onCancelar} className="px-4 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] transition">Cancelar</button>
      </div>
    </div>
  );
}

// ── Form atendimento (modal) ──────────────────────────────────────────────────
const FORMAS_PAG = ["Pix", "Cartão de débito", "Cartão de crédito", "Dinheiro"] as const;

function FormAtendimento({ data, inicial, agendamento, onSalvo, onCancelar }: {
  data: string;
  inicial?: AtendimentoAvulso;
  agendamento?: Agendamento;
  onSalvo: () => void;
  onCancelar: () => void;
}) {
  type CatalogItem = { id: string; titulo: string; preco: number; tipo: "servico" | "produto" };
  type ItemForm = { catalogKey: string; tipo: "servico" | "produto"; descricao: string; valor: string; produtoId?: string };

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  const [clienteNome, setClienteNome] = useState(agendamento?.nome ?? inicial?.clienteNome ?? "");
  const [clienteTelefone, setClienteTelefone] = useState(inicial?.clienteTelefone ?? "");
  const [formaPagamento, setFormaPagamento] = useState(inicial?.formaPagamento ?? "Pix");
  const [itens, setItens] = useState<ItemForm[]>(
    inicial?.itens.map((i) => ({ catalogKey: "manual", tipo: i.tipo, descricao: i.descricao, valor: String(i.valor) }))
    ?? [{ catalogKey: "manual", tipo: "servico", descricao: "", valor: "" }]
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const nomeFixo = !!agendamento;

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/itens", { credentials: "include" }).then((r) => r.ok ? r.json() : { items: [] }),
      fetch("/api/admin/produtos", { credentials: "include" }).then((r) => r.ok ? r.json() : { produtos: [] }),
    ]).then(([s, p]) => {
      const parsePreco = (v: unknown) => parseFloat(String(v).replace(",", ".")) || 0;
      const servs: CatalogItem[] = (s.items ?? []).filter((i: { status: string }) => i.status === "published").map((i: { id: string; titulo: string; preco: unknown }) => ({ ...i, preco: parsePreco(i.preco), tipo: "servico" as const }));
      const prods: CatalogItem[] = (p.produtos ?? []).filter((i: { status: string }) => i.status === "published").map((i: { id: string; titulo: string; preco: unknown }) => ({ ...i, preco: parsePreco(i.preco), tipo: "produto" as const }));
      setCatalog([...servs, ...prods]);
    });
  }, []);

  function addItem() { setItens((p) => [...p, { catalogKey: "manual", tipo: "servico", descricao: "", valor: "" }]); }
  function removeItem(i: number) { setItens((p) => p.filter((_, idx) => idx !== i)); }

  function selecionarCatalog(i: number, key: string) {
    if (key === "manual") {
      setItens((p) => p.map((it, idx) => idx === i ? { ...it, catalogKey: "manual", descricao: "", valor: "" } : it));
      return;
    }
    const found = catalog.find((c) => `${c.tipo[0]}:${c.id}` === key);
    if (found) {
      setItens((p) => p.map((it, idx) => idx === i
        ? { catalogKey: key, tipo: found.tipo, descricao: found.titulo, valor: String(found.preco), produtoId: found.tipo === "produto" ? found.id : undefined }
        : it));
    }
  }

  function updateValor(i: number, v: string) {
    setItens((p) => p.map((it, idx) => idx === i ? { ...it, valor: v } : it));
  }
  function updateDescManual(i: number, v: string) {
    setItens((p) => p.map((it, idx) => idx === i ? { ...it, descricao: v } : it));
  }
  function changeTipo(i: number, tipo: "servico" | "produto") {
    setItens((p) => p.map((it, idx) => idx === i ? { ...it, tipo, catalogKey: "manual", descricao: "", valor: "" } : it));
  }

  async function salvar() {
    if (!clienteNome.trim()) { setErro("Nome do cliente obrigatório"); return; }
    const validos = itens.filter((i) => i.descricao.trim() && !isNaN(Number(i.valor)) && Number(i.valor) > 0);
    if (!validos.length) { setErro("Adicione ao menos um item com descrição e valor válido"); return; }
    setErro(""); setSalvando(true);
    const itensFormatados: ItemAtendimento[] = validos.map((it, idx) => ({
      id: String(Date.now() + idx), tipo: it.tipo, descricao: it.descricao.trim(), valor: Number(it.valor),
      ...(it.produtoId ? { produtoId: it.produtoId } : {}),
    }));
    const payload = {
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone.trim() || undefined,
      formaPagamento,
      itens: itensFormatados,
    };
    if (inicial) {
      await fetch(`/api/atendimentos-avulsos/${inicial.id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/atendimentos-avulsos", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, ...payload, agendamentoId: agendamento?.id }),
      });
    }
    setSalvando(false);
    onSalvo();
  }

  const servicos = catalog.filter((c) => c.tipo === "servico");
  const produtos = catalog.filter((c) => c.tipo === "produto");
  const titulo = inicial ? "Editar atendimento" : agendamento ? "Itens adicionais" : "Novo atendimento";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancelar}>
      <div
        className="bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
          <div>
            <h3 className="font-bold text-[#F5E6C8] text-sm">{titulo}</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
          </div>
          <button onClick={onCancelar} className="text-gray-600 hover:text-gray-300 transition p-1"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
          {erro && <p className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded px-3 py-2">{erro}</p>}

          {/* Cliente */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-2">Cliente</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={clienteNome} onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Nome do cliente *"
                readOnly={nomeFixo}
                className={`${inp} col-span-2 sm:col-span-1 ${nomeFixo ? "opacity-50 cursor-default" : ""}`}
              />
              <input
                value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)}
                placeholder="Telefone (opcional)"
                className={`${inp} col-span-2 sm:col-span-1`}
              />
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-2">Pagamento</p>
            <div className="flex flex-wrap gap-1.5">
              {FORMAS_PAG.map((f) => (
                <button key={f} onClick={() => setFormaPagamento(f)}
                  className={`px-3 py-1.5 text-xs rounded border transition ${formaPagamento === f ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-500 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Agendamento base (read-only) */}
          {agendamento && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-2">Serviço base (agendamento)</p>
              <div className="flex justify-between text-xs px-3 py-2.5 bg-[#0f0f0f] border border-[#2d2d2d] rounded-lg">
                <span className="text-gray-400">{agendamento.servico}</span>
                <span className="text-[#b8944a] font-medium">{agendamento.preco}</span>
              </div>
            </div>
          )}

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">
                {agendamento ? "Itens adicionais" : "Itens *"}
              </p>
              <button onClick={addItem} className="flex items-center gap-1 text-[10px] text-[#b8944a]/70 hover:text-[#b8944a] transition font-semibold tracking-widest uppercase">
                <Plus size={10} /> Adicionar item
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {itens.map((item, i) => {
                const catalogDaTipo = item.tipo === "servico" ? servicos : produtos;
                return (
                <div key={i} className="bg-[#0f0f0f] border border-[#2d2d2d] rounded-lg p-3 flex flex-col gap-2.5">
                  {/* Tipo + excluir */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <button
                        onClick={() => changeTipo(i, "servico")}
                        className={`px-3 py-1.5 text-xs rounded border transition ${item.tipo === "servico" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-500 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
                        ✂️ Serviço
                      </button>
                      <button
                        onClick={() => changeTipo(i, "produto")}
                        className={`px-3 py-1.5 text-xs rounded border transition ${item.tipo === "produto" ? "bg-[#b8944a] text-[#0A0A0A] border-[#b8944a] font-bold" : "text-gray-500 border-[#2d2d2d] hover:border-[#b8944a]"}`}>
                        📦 Produto
                      </button>
                    </div>
                    {itens.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-gray-600 hover:text-red-400 transition p-1"><Trash2 size={13} /></button>
                    )}
                  </div>

                  {/* Seleção do catálogo filtrada pelo tipo */}
                  <select
                    value={item.catalogKey}
                    onChange={(e) => selecionarCatalog(i, e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#2d2d2d] rounded px-2.5 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]"
                  >
                    <option value="manual">— Digitar manualmente —</option>
                    {catalogDaTipo.map((c) => (
                      <option key={c.id} value={`${c.tipo[0]}:${c.id}`}>
                        {c.titulo} — R$ {c.preco.toFixed(2).replace(".", ",")}
                      </option>
                    ))}
                  </select>

                  {/* Campo de nome (só se manual) */}
                  {item.catalogKey === "manual" && (
                    <input
                      value={item.descricao} onChange={(e) => updateDescManual(i, e.target.value)}
                      placeholder={item.tipo === "servico" ? "Nome do serviço..." : "Nome do produto..."}
                      className={inp}
                    />
                  )}

                  {/* Valor (sempre editável) */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-600 tracking-widest uppercase shrink-0">Valor (R$)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={item.valor} onChange={(e) => updateValor(i, e.target.value)}
                      placeholder="0,00"
                      className={`${inp} flex-1`}
                    />
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#1e1e1e] flex gap-2 shrink-0">
          <button onClick={salvar} disabled={salvando}
            className="flex-1 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-[#c9a84c] transition disabled:opacity-50">
            {salvando ? "Salvando..." : "Registrar atendimento"}
          </button>
          <button onClick={onCancelar}
            className="px-5 py-2.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] transition">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
interface Props {
  fechamentos: FechamentoDia[];
  gastosDia: GastoDia[];
  avulsos: AtendimentoAvulso[];
  onAtualizar: () => void;
}

export default function CaixaCalendario({ fechamentos, gastosDia, avulsos, onAtualizar }: Props) {
  const hoje = new Date().toISOString().split("T")[0];

  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [mes, setMes] = useState(() => new Date().getMonth());
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [agsDia, setAgsDia] = useState<Agendamento[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [reabrindo, setReabrindo] = useState(false);
  const [mostraFormGasto, setMostraFormGasto] = useState(false);
  const [mostraFormAtendimento, setMostraFormAtendimento] = useState(false);
  const [modalReabrir, setModalReabrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);
  const [modalExcluirAvulso, setModalExcluirAvulso] = useState<string | null>(null);
  // agendamento cujo form de "itens adicionais" está aberto (abre modal direto)
  const [agAtivo, setAgAtivo] = useState<string | null>(null);
  // avulso standalone sendo editado
  const [editandoAvulso, setEditandoAvulso] = useState<AtendimentoAvulso | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const p = searchParams.get("dia");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) {
      setDiaSel(p);
      const d = new Date(p + "T12:00:00");
      setAno(d.getFullYear()); setMes(d.getMonth());
      // Scroll até o caixa após um tick para garantir que o DOM está pronto
      setTimeout(() => {
        document.getElementById("caixa")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      setDiaSel(hoje);
    }
  }, [searchParams]); // eslint-disable-line

  const fechPorData = Object.fromEntries(fechamentos.map((f) => [f.data, f]));
  const gastosPorData: Record<string, GastoDia[]> = {};
  gastosDia.forEach((g) => { gastosPorData[g.data] = [...(gastosPorData[g.data] ?? []), g]; });

  const carregarAgs = useCallback(async (data: string) => {
    setCarregando(true); setAgsDia(null);
    try {
      const res = await fetch(`/api/agendamentos?data=${data}`, { credentials: "include" });
      if (res.ok) setAgsDia(await res.json());
    } finally { setCarregando(false); }
  }, []);

  useEffect(() => {
    if (!diaSel) { setAgsDia(null); return; }
    setMostraFormGasto(false);
    setMostraFormAtendimento(false);
    setAgAtivo(null);
    setEditandoAvulso(null);
    const fech = fechPorData[diaSel];
    if (fech) setAgsDia(fech.agendamentos);
    else carregarAgs(diaSel);
  }, [diaSel, fechamentos]); // eslint-disable-line

  // Derived values para o dia selecionado
  const fechDia = diaSel ? fechPorData[diaSel] : null;
  const gastosDiaSel = diaSel ? (gastosPorData[diaSel] ?? []) : [];
  const totalGastosDiaSel = gastosDiaSel.reduce((s, g) => s + g.valor, 0);

  // Avulsos do dia selecionado (apenas para dias em aberto)
  const avulsosDia = diaSel && !fechDia ? avulsos.filter((a) => a.data === diaSel) : [];
  const avulsosStandalone = avulsosDia.filter((a) => !a.agendamentoId);
  const avulsoPorAg: Record<string, AtendimentoAvulso> = {};
  avulsosDia.forEach((a) => { if (a.agendamentoId) avulsoPorAg[a.agendamentoId] = a; });
  const totalAvulsosDia = avulsosDia.reduce((s, a) => s + a.total, 0);

  const concluidos = agsDia?.filter((a) => a.status === "concluido") ?? [];
  const totalAberto = concluidos.reduce((s, a) => s + parsePriceNum(a.preco), 0);
  const ehFuturo = diaSel ? diaSel > hoje : false;
  const ehHoje = diaSel === hoje;
  const totalFaturamento = fechDia?.totalServicos ?? (totalAberto + totalAvulsosDia);
  const lucroLiquido = totalFaturamento - totalGastosDiaSel;
  const podeEditar = !fechDia && !ehFuturo;

  async function fecharCaixa() {
    if (!diaSel) return;
    setFechando(true);
    try {
      await fetch("/api/fechamento", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: diaSel }),
      });
      onAtualizar();
    } finally { setFechando(false); }
  }

  async function reabrirCaixa() {
    if (!diaSel) return;
    const fech = fechPorData[diaSel];
    if (!fech) return;
    setReabrindo(true);
    try {
      await fetch(`/api/fechamento/${fech.id}`, { method: "DELETE", credentials: "include" });
      onAtualizar();
    } finally { setReabrindo(false); setModalReabrir(false); }
  }

  async function excluirGasto(id: string) {
    await fetch(`/api/gastos-dia/${id}`, { method: "DELETE", credentials: "include" });
    onAtualizar();
  }

  async function excluirAvulso(id: string) {
    await fetch(`/api/atendimentos-avulsos/${id}`, { method: "DELETE", credentials: "include" });
    setModalExcluirAvulso(null);
    onAtualizar();
  }

  function navMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear()); setMes(d.getMonth());
  }

  function fecharTodosFormularios() {
    setMostraFormGasto(false);
    setMostraFormAtendimento(false);
    setAgAtivo(null);
    setEditandoAvulso(null);
  }

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  // Avulsos por data para o calendário
  const avulsosPorData: Record<string, number> = {};
  avulsos.forEach((a) => { avulsosPorData[a.data] = (avulsosPorData[a.data] ?? 0) + a.total; });

  return (
    <>
      {modalReabrir && (
        <ModalConfirm
          titulo="Reabrir caixa?"
          mensagem="O fechamento será excluído. Os agendamentos e atendimentos voltarão ao estado editável."
          confirmLabel={reabrindo ? "Reabrindo..." : "Reabrir"}
          confirmClass="bg-red-900/60 text-red-300 border border-red-800/60 hover:bg-red-900/80"
          onConfirm={reabrirCaixa}
          onCancel={() => setModalReabrir(false)}
        />
      )}
      {modalFechar && diaSel && (
        <ModalConfirm
          titulo="Fechar o caixa?"
          mensagem={`Os atendimentos de ${new Date(diaSel + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} serão consolidados. Você ainda poderá reabrir caso precise corrigir algo.`}
          confirmLabel={fechando ? "Fechando..." : "Fechar caixa"}
          confirmClass="bg-[#b8944a] text-[#0A0A0A] font-bold hover:bg-[#c9a84c]"
          onConfirm={() => { setModalFechar(false); fecharCaixa(); }}
          onCancel={() => setModalFechar(false)}
        />
      )}
      {modalExcluirAvulso && (
        <ModalConfirm
          titulo="Remover atendimento?"
          mensagem="Este atendimento será removido permanentemente e o valor não entrará no fechamento."
          confirmLabel="Remover"
          confirmClass="bg-red-900/60 text-red-300 border border-red-800/60 hover:bg-red-900/80"
          onConfirm={() => excluirAvulso(modalExcluirAvulso)}
          onCancel={() => setModalExcluirAvulso(null)}
        />
      )}

      <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden">

        {/* ── Cabeçalho ── */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#1e1e1e]">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#b8944a]/10 border border-[#b8944a]/20">
            <Wallet size={14} className="text-[#b8944a]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#F5E6C8] tracking-wide">Caixa</p>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Fechamentos e gastos por dia</p>
          </div>
        </div>

        {/* ── Painel do dia ── */}
        {diaSel && (
          <div className="border-b border-[#2d2d2d] p-5">
            {/* Header do dia */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-bold text-[#F5E6C8] tracking-widest">
                  {new Date(diaSel + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
                {fechDia && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-500 border border-[#2d2d2d] rounded px-1.5 py-0.5">
                    <Lock size={9} /> FECHADO
                  </span>
                )}
                {ehHoje && !fechDia && (
                  <span className="text-[10px] font-bold tracking-widest text-[#b8944a] border border-[#b8944a]/30 rounded px-1.5 py-0.5">HOJE</span>
                )}
              </div>
              <button onClick={() => setDiaSel(null)} className="text-gray-600 hover:text-gray-400 transition"><X size={14} /></button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 mb-0.5">FATURAMENTO</p>
                <p className="text-lg font-bold text-[#F5E6C8]">{brl(totalFaturamento)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 mb-0.5">GASTOS</p>
                <p className="text-lg font-bold text-red-400">{brl(totalGastosDiaSel)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 mb-0.5">LÍQUIDO</p>
                <p className={`text-lg font-bold ${lucroLiquido >= 0 ? "text-green-400" : "text-red-400"}`}>{brl(lucroLiquido)}</p>
              </div>
            </div>

            {/* ── Lista de atendimentos (dia aberto) ── */}
            {!fechDia && (
              <>
                {carregando ? (
                  <p className="text-sm text-gray-600 mb-3">Carregando...</p>
                ) : (concluidos.length > 0 || avulsosDia.length > 0) ? (
                  <div className="flex flex-col mb-3 border border-[#1a1a1a] rounded-lg overflow-hidden">
                    {/* Agendamentos concluídos */}
                    {concluidos.map((ag) => {
                      const vinculado = avulsoPorAg[ag.id];
                      const totalCliente = parsePriceNum(ag.preco) + (vinculado?.total ?? 0);
                      return (
                        <div key={ag.id} className="border-b border-[#1a1a1a] last:border-b-0 flex justify-between items-center px-3 py-2 text-xs">
                          <span className="text-[#F5E6C8] min-w-0 truncate">
                            {ag.nome}
                            <span className="text-gray-600"> · {ag.servico}</span>
                            {vinculado && (
                              <span className="ml-1.5 text-[9px] text-[#b8944a]/60 border border-[#b8944a]/20 rounded px-1">
                                +{vinculado.itens.length} item{vinculado.itens.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[#b8944a] font-medium">{vinculado ? brl(totalCliente) : ag.preco}</span>
                            {podeEditar && (
                              <button
                                onClick={() => { setAgAtivo(ag.id); setMostraFormAtendimento(false); setEditandoAvulso(null); }}
                                title={vinculado ? "Editar itens" : "Adicionar itens"}
                                className="text-gray-600 hover:text-[#b8944a] transition p-0.5"
                              >
                                <Plus size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* Modal de itens adicionais do agendamento */}
                    {agAtivo && (() => {
                      const ag = concluidos.find((a) => a.id === agAtivo);
                      const vinculado = ag ? avulsoPorAg[ag.id] : undefined;
                      return ag ? (
                        <FormAtendimento
                          data={diaSel}
                          inicial={vinculado}
                          agendamento={ag}
                          onSalvo={() => { setAgAtivo(null); onAtualizar(); }}
                          onCancelar={() => setAgAtivo(null)}
                        />
                      ) : null;
                    })()}

                    {/* Atendimentos avulsos standalone */}
                    {avulsosStandalone.map((av) => (
                      <div key={av.id} className="border-b border-[#1a1a1a] last:border-b-0">
                        <div className="flex justify-between items-center px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <UserPlus size={11} className="text-[#b8944a]/50 shrink-0" />
                            <span className="text-[#F5E6C8] text-xs truncate">{av.clienteNome}</span>
                            <span className="text-[9px] text-[#b8944a]/60 border border-[#b8944a]/20 rounded px-1 shrink-0">avulso</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[#b8944a] text-xs font-medium">{brl(av.total)}</span>
                            <button
                              onClick={() => { setEditandoAvulso(av); setMostraFormAtendimento(false); setAgAtivo(null); }}
                              className="text-gray-600 hover:text-gray-300 transition p-0.5"
                            ><Pencil size={11} /></button>
                            <button onClick={() => setModalExcluirAvulso(av.id)} className="text-gray-600 hover:text-red-400 transition p-0.5"><Trash2 size={11} /></button>
                          </div>
                        </div>
                        {editandoAvulso?.id === av.id && (
                          <div className="px-3 pb-3 bg-[#0a0a0a]">
                            <FormAtendimento
                              data={diaSel}
                              inicial={av}
                              onSalvo={() => { setEditandoAvulso(null); onAtualizar(); }}
                              onCancelar={() => setEditandoAvulso(null)}
                            />
                          </div>
                        )}
                        {editandoAvulso?.id !== av.id && (
                          <div className="px-3 pb-2 pl-8">
                            {av.itens.map((it) => (
                              <div key={it.id} className="flex justify-between text-xs py-0.5">
                                <span className="text-gray-600">{it.tipo === "produto" ? "📦" : "✂️"} {it.descricao}</span>
                                <span className="text-gray-500">{brl(it.valor)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : !ehFuturo && (
                  <p className="text-sm text-gray-500 mb-3">Nenhum atendimento registrado neste dia.</p>
                )}

                {/* Form novo atendimento */}
                {mostraFormAtendimento && (
                  <FormAtendimento
                    data={diaSel}
                    onSalvo={() => { setMostraFormAtendimento(false); onAtualizar(); }}
                    onCancelar={() => setMostraFormAtendimento(false)}
                  />
                )}
              </>
            )}

            {/* ── Lista de atendimentos (dia fechado — snapshot) ── */}
            {fechDia && (
              <>
                {fechDia.agendamentos.length > 0 && (
                  <div className="flex flex-col divide-y divide-[#111] mb-3 max-h-40 overflow-y-auto">
                    {fechDia.agendamentos.map((a) => (
                      <div key={a.id} className="flex justify-between items-center py-1.5 text-xs">
                        <span className="text-[#F5E6C8]">{a.nome}<span className="text-gray-600"> · {a.servico}</span></span>
                        <span className="text-[#b8944a] font-medium ml-3 shrink-0">{a.preco}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(fechDia.avulsos ?? []).length > 0 && (
                  <div className="flex flex-col divide-y divide-[#111] mb-3 max-h-32 overflow-y-auto border-t border-[#1a1a1a] pt-2">
                    <p className="text-[10px] tracking-widest text-gray-600 uppercase pb-1">Atendimentos avulsos</p>
                    {(fechDia.avulsos ?? []).map((av) => (
                      <div key={av.id} className="py-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#F5E6C8] flex items-center gap-1"><UserPlus size={10} className="text-[#b8944a]/40" /> {av.clienteNome}</span>
                          <span className="text-[#b8944a] font-medium">{brl(av.total)}</span>
                        </div>
                        {av.itens.map((it) => (
                          <div key={it.id} className="flex justify-between text-xs pl-4 text-gray-600">
                            <span>{it.descricao}</span><span>{brl(it.valor)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {(fechDia.extras ?? []).length > 0 && (
                  <div className="flex flex-col divide-y divide-[#111] mb-3 border-t border-[#1a1a1a] pt-2">
                    <p className="text-[10px] tracking-widest text-gray-600 uppercase pb-1">Extras adicionados</p>
                    {(fechDia.extras ?? []).map((ex) => (
                      <div key={ex.id} className="flex justify-between items-center py-1.5 text-xs">
                        <span className="text-gray-400">{ex.descricao}</span>
                        <span className="text-[#b8944a] font-medium">+{brl(ex.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Gastos do dia ── */}
            {gastosDiaSel.length > 0 && (
              <div className="flex flex-col divide-y divide-[#111] mb-3 max-h-28 overflow-y-auto border-t border-[#1a1a1a] pt-2 mt-1">
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 pb-1.5">Gastos do dia</p>
                {gastosDiaSel.map((g) => (
                  <div key={g.id} className="flex justify-between items-center py-1.5 text-xs">
                    <span className="text-gray-400">{g.descricao}</span>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-red-400 font-medium">−{brl(g.valor)}</span>
                      <button onClick={() => excluirGasto(g.id)} className="text-gray-700 hover:text-red-400 transition"><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Form gasto ── */}
            {mostraFormGasto && (
              <FormGastoDia
                data={diaSel}
                onSalvo={() => { setMostraFormGasto(false); onAtualizar(); }}
                onCancelar={() => setMostraFormGasto(false)}
              />
            )}

            {/* ── Botões de ação ── */}
            {!mostraFormGasto && !mostraFormAtendimento && !agAtivo && !editandoAvulso && (
              <div className="flex flex-col gap-2 mt-3">
                {!ehFuturo && !fechDia && (
                  <button
                    onClick={() => { fecharTodosFormularios(); setMostraFormAtendimento(true); }}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest border border-[#b8944a]/30 text-[#b8944a]/80 hover:border-[#b8944a] hover:text-[#b8944a] hover:bg-[#b8944a]/5 px-4 py-2.5 rounded transition">
                    <Scissors size={11} /> NOVO ATENDIMENTO
                  </button>
                )}
                {!ehFuturo && (
                  <button onClick={() => { fecharTodosFormularios(); setMostraFormGasto(true); }}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest border border-red-900/40 text-red-400/70 hover:border-red-800 hover:text-red-400 px-4 py-2.5 rounded transition">
                    <TrendingDown size={11} /> DESPESA DO DIA
                  </button>
                )}
                {!fechDia && !ehFuturo && (
                  <button onClick={() => setModalFechar(true)} disabled={fechando || carregando}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest bg-[#b8944a]/10 border border-[#b8944a]/40 text-[#b8944a] hover:bg-[#b8944a]/20 hover:border-[#b8944a] px-4 py-2.5 rounded transition disabled:opacity-50">
                    <Lock size={11} /> {fechando ? "FECHANDO..." : ehHoje ? "FECHAR CAIXA" : "FECHAR CAIXA (RETROATIVO)"}
                  </button>
                )}
                {fechDia && (
                  <button onClick={() => setModalReabrir(true)}
                    className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest border border-[#2d2d2d] text-gray-600 hover:border-red-800/60 hover:text-red-400 px-4 py-2.5 rounded transition">
                    <Unlock size={11} /> REABRIR CAIXA
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Calendário ── */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navMes(-1)} className="p-1 text-gray-500 hover:text-gray-300 transition"><ChevronLeft size={16} /></button>
            <span className="text-xs font-bold tracking-widest text-[#F5E6C8]">{MESES[mes]} {ano}</span>
            <button onClick={() => navMes(1)} className="p-1 text-gray-500 hover:text-gray-300 transition"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DIAS.map((d) => <div key={d} className="text-center text-[9px] font-medium tracking-widest text-gray-600 py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((dia, i) => {
              if (dia === null) return <div key={`e-${i}`} />;
              const data = toDataStr(ano, mes, dia);
              const fech = fechPorData[data];
              const gastosNoDia = gastosPorData[data] ?? [];
              const totalGastos = gastosNoDia.reduce((s, g) => s + g.valor, 0);
              const fat = fech?.totalServicos ?? (avulsosPorData[data] ?? 0);
              const liquido = fat - totalGastos;
              const temMovimento = fech || totalGastos > 0 || (avulsosPorData[data] ?? 0) > 0;
              const eHoje = data === hoje;
              const sel = data === diaSel;
              const futuro = data > hoje;

              let borderCls = "border-transparent";
              if (sel) borderCls = "border-[#F5E6C8]/40";
              else if (eHoje && !fech) borderCls = "border-[#F5E6C8]/15";
              else if (fech && liquido > 0) borderCls = "border-green-900/50";
              else if (temMovimento && liquido <= 0) borderCls = "border-red-900/50";

              const valorLabel = fech
                ? (liquido >= 0 ? `+${brl(liquido).replace("R$ ", "R$")}` : `−${brl(Math.abs(liquido)).replace("R$ ", "R$")}`)
                : null;
              const corLabel = liquido >= 0 ? "text-green-400" : "text-red-400";

              return (
                <button key={data} onClick={() => setDiaSel(sel ? null : data)}
                  className={`relative flex flex-col items-center justify-center py-2 rounded border transition-all ${borderCls} ${sel ? "bg-[#1a1a1a]" : "hover:bg-[#0f0f0f]"} ${futuro && !sel ? "opacity-25" : ""}`}>
                  <span className={`text-xs font-medium ${eHoje ? "text-white" : fech ? "text-[#F5E6C8]" : "text-gray-500"}`}>{dia}</span>
                  {valorLabel && (
                    <span className={`text-[9px] font-medium leading-none mt-0.5 hidden sm:block ${corLabel}`}>{valorLabel}</span>
                  )}
                  {!fech && totalGastos > 0 && (
                    <span className="text-[9px] text-red-400 font-medium leading-none mt-0.5 hidden sm:block">−{brl(totalGastos).replace("R$ ", "R$")}</span>
                  )}
                  {eHoje && !fech && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#b8944a]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[#111]">
            {[
              { cls: "border-green-900/50", label: "LUCRO POSITIVO" },
              { cls: "border-red-900/50", label: "SALDO NEGATIVO / GASTO" },
              { cls: "border-[#F5E6C8]/15", label: "PENDENTE / ABERTO" },
              { cls: "border-yellow-800/50", label: "VENCIMENTO DE GASTO" },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 border rounded-sm ${cls}`} />
                <span className="text-[9px] font-medium tracking-widest text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
