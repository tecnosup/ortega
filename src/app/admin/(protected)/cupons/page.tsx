"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Tag, Percent, DollarSign } from "lucide-react";
import type { Cupom, TipoCupom } from "@/lib/cupons-tipos";

function brl(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a]";

function FormCupom({ inicial, onSalvar, onCancelar, salvando }: {
  inicial?: Partial<Cupom>; onSalvar: (data: Partial<Cupom>) => void;
  onCancelar: () => void; salvando: boolean;
}) {
  const [codigo, setCodigo] = useState(inicial?.codigo ?? "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [tipo, setTipo] = useState<TipoCupom>(inicial?.tipo ?? "percentual");
  const [valor, setValor] = useState(String(inicial?.valor ?? ""));
  const [ativo, setAtivo] = useState(inicial?.ativo ?? true);
  const [usoMaximo, setUsoMaximo] = useState(String(inicial?.usoMaximo ?? ""));
  const [erro, setErro] = useState("");

  function submit() {
    if (!codigo.trim()) { setErro("Código obrigatório"); return; }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { setErro("Valor inválido"); return; }
    setErro("");
    onSalvar({ codigo: codigo.toUpperCase().trim(), descricao, tipo, valor: Number(valor), ativo, usoMaximo: usoMaximo ? Number(usoMaximo) : null });
  }

  return (
    <div className="bg-[#111] border border-[#2d2d2d] rounded-lg p-6 flex flex-col gap-4">
      <h3 className="font-semibold text-[#F5E6C8]">{inicial?.id ? "Editar cupom" : "Novo cupom"}</h3>
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Código *</label>
          <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="ex: ORTEGA10" className={`${inp} font-mono`} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Descrição</label>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="ex: Desconto de lançamento" className={inp} />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Tipo *</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCupom)} className={inp}>
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Fixo (R$)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Valor * {tipo === "percentual" ? "(%)" : "(R$)"}</label>
          <input type="number" min="0" max={tipo === "percentual" ? "100" : undefined} value={valor} onChange={(e) => setValor(e.target.value)} placeholder={tipo === "percentual" ? "ex: 10" : "ex: 15"} className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Limite de usos</label>
          <input type="number" min="1" value={usoMaximo} onChange={(e) => setUsoMaximo(e.target.value)} placeholder="em branco = ilimitado" className={inp} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer w-fit">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="accent-[#b8944a]" />
        Cupom ativo
      </label>
      <div className="flex gap-3 pt-2">
        <button onClick={submit} disabled={salvando} className="px-5 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50">
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button onClick={onCancelar} className="px-5 py-2 border border-[#2d2d2d] text-gray-400 text-sm rounded hover:border-[#b8944a] transition">
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function CuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostraForm, setMostraForm] = useState(false);
  const [editando, setEditando] = useState<Cupom | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  async function carregar() {
    const res = await fetch("/api/cupons", { credentials: "include" });
    if (res.ok) setCupons(await res.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(data: Partial<Cupom>) {
    setSalvando(true);
    if (editando) {
      await fetch(`/api/cupons/${editando.id}`, { credentials: "include",  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setEditando(null);
    } else {
      await fetch("/api/cupons", { credentials: "include",  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setMostraForm(false);
    }
    setSalvando(false);
    carregar();
  }

  async function toggleAtivo(c: Cupom) {
    await fetch(`/api/cupons/${c.id}`, { credentials: "include",  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !c.ativo }) });
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este cupom?")) return;
    setExcluindo(id);
    await fetch(`/api/cupons/${id}`, { credentials: "include",  method: "DELETE" });
    setExcluindo(null);
    carregar();
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Cupons</h1>
        <button onClick={() => { setEditando(null); setMostraForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition">
          <Plus size={16} /> Novo cupom
        </button>
      </div>

      {(mostraForm && !editando) && <FormCupom onSalvar={salvar} onCancelar={() => setMostraForm(false)} salvando={salvando} />}
      {editando && <FormCupom inicial={editando} onSalvar={salvar} onCancelar={() => setEditando(null)} salvando={salvando} />}

      {carregando ? (
        <p className="text-sm text-gray-500 text-center py-12">Carregando...</p>
      ) : cupons.length === 0 ? (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg p-12 text-center">
          <Tag size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhum cupom criado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cupons.map((c) => (
            <div key={c.id} className={`bg-[#111] border rounded-lg p-5 flex items-center gap-4 transition ${c.ativo ? "border-[#2d2d2d]" : "border-[#1a1a1a] opacity-50"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.tipo === "percentual" ? "bg-blue-900/30 text-blue-400" : "bg-green-900/30 text-green-400"}`}>
                {c.tipo === "percentual" ? <Percent size={18} /> : <DollarSign size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#F5E6C8]">{c.codigo}</span>
                  {!c.ativo && <span className="text-xs px-2 py-0.5 bg-[#1a1a1a] text-gray-500 rounded-full">inativo</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{c.descricao || "—"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-[#b8944a]">{c.tipo === "percentual" ? `${c.valor}%` : brl(c.valor)}</p>
                <p className="text-xs text-gray-500">{c.usoAtual}{c.usoMaximo !== null ? `/${c.usoMaximo}` : ""} uso{c.usoAtual !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleAtivo(c)} className={`p-2 rounded transition ${c.ativo ? "text-green-400 hover:text-green-300" : "text-gray-600 hover:text-gray-400"}`} title={c.ativo ? "Desativar" : "Ativar"}>
                  {c.ativo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => { setMostraForm(false); setEditando(c); }} className="p-2 text-gray-500 hover:text-[#F5E6C8] rounded transition" title="Editar"><Edit2 size={16} /></button>
                <button onClick={() => excluir(c.id)} disabled={excluindo === c.id} className="p-2 text-gray-500 hover:text-red-400 rounded transition disabled:opacity-40" title="Excluir"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
