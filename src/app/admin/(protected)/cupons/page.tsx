"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Tag, Percent, DollarSign } from "lucide-react";
import type { Cupom, TipoCupom } from "@/lib/cupons-tipos";

function brl(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function FormCupom({
  inicial,
  onSalvar,
  onCancelar,
  salvando,
}: {
  inicial?: Partial<Cupom>;
  onSalvar: (data: Partial<Cupom>) => void;
  onCancelar: () => void;
  salvando: boolean;
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
    onSalvar({
      codigo: codigo.toUpperCase().trim(),
      descricao,
      tipo,
      valor: Number(valor),
      ativo,
      usoMaximo: usoMaximo ? Number(usoMaximo) : null,
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
      <h3 className="font-semibold text-gray-900">{inicial?.id ? "Editar cupom" : "Novo cupom"}</h3>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Código *</label>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="ex: ORTEGA10"
            className="border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#b8944a]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Descrição</label>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="ex: Desconto de lançamento"
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tipo *</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCupom)}
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]"
          >
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Fixo (R$)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Valor * {tipo === "percentual" ? "(%)" : "(R$)"}
          </label>
          <input
            type="number"
            min="0"
            max={tipo === "percentual" ? "100" : undefined}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={tipo === "percentual" ? "ex: 10" : "ex: 15"}
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Limite de usos</label>
          <input
            type="number"
            min="1"
            value={usoMaximo}
            onChange={(e) => setUsoMaximo(e.target.value)}
            placeholder="em branco = ilimitado"
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#b8944a]"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer w-fit">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="accent-[#b8944a]" />
        Cupom ativo
      </label>

      <div className="flex gap-3 pt-2">
        <button
          onClick={submit}
          disabled={salvando}
          className="px-5 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded hover:bg-[#2d2d2d] transition disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button
          onClick={onCancelar}
          className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded hover:border-gray-400 transition"
        >
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
    const res = await fetch("/api/cupons");
    if (res.ok) setCupons(await res.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(data: Partial<Cupom>) {
    setSalvando(true);
    if (editando) {
      await fetch(`/api/cupons/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setEditando(null);
    } else {
      await fetch("/api/cupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setMostraForm(false);
    }
    setSalvando(false);
    carregar();
  }

  async function toggleAtivo(c: Cupom) {
    await fetch(`/api/cupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !c.ativo }),
    });
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este cupom?")) return;
    setExcluindo(id);
    await fetch(`/api/cupons/${id}`, { method: "DELETE" });
    setExcluindo(null);
    carregar();
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cupons</h1>
        <button
          onClick={() => { setEditando(null); setMostraForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded hover:bg-[#2d2d2d] transition"
        >
          <Plus size={16} /> Novo cupom
        </button>
      </div>

      {(mostraForm && !editando) && (
        <FormCupom onSalvar={salvar} onCancelar={() => setMostraForm(false)} salvando={salvando} />
      )}

      {editando && (
        <FormCupom
          inicial={editando}
          onSalvar={salvar}
          onCancelar={() => setEditando(null)}
          salvando={salvando}
        />
      )}

      {carregando ? (
        <p className="text-sm text-gray-400 text-center py-12">Carregando...</p>
      ) : cupons.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Tag size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum cupom criado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cupons.map((c) => (
            <div key={c.id} className={`bg-white border rounded-lg p-5 flex items-center gap-4 transition ${c.ativo ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
              {/* ícone tipo */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.tipo === "percentual" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                {c.tipo === "percentual" ? <Percent size={18} /> : <DollarSign size={18} />}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-gray-900">{c.codigo}</span>
                  {!c.ativo && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">inativo</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{c.descricao || "—"}</p>
              </div>

              {/* valor */}
              <div className="text-right shrink-0">
                <p className="font-bold text-[#b8944a]">
                  {c.tipo === "percentual" ? `${c.valor}%` : brl(c.valor)}
                </p>
                <p className="text-xs text-gray-400">
                  {c.usoAtual}{c.usoMaximo !== null ? `/${c.usoMaximo}` : ""} uso{c.usoAtual !== 1 ? "s" : ""}
                </p>
              </div>

              {/* ações */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleAtivo(c)}
                  className={`p-2 rounded transition ${c.ativo ? "text-green-600 hover:text-green-700" : "text-gray-300 hover:text-gray-500"}`}
                  title={c.ativo ? "Desativar" : "Ativar"}
                >
                  {c.ativo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button
                  onClick={() => { setMostraForm(false); setEditando(c); }}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded transition"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => excluir(c.id)}
                  disabled={excluindo === c.id}
                  className="p-2 text-gray-400 hover:text-red-500 rounded transition disabled:opacity-40"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
