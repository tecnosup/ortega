"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Edit2, Trash2, X, Check, Loader2, KeyRound, Unlink } from "lucide-react";
import type { Barbeiro, ComissaoServico } from "@/lib/barbeiros-types";
import type { Item } from "@/lib/admin-items";

type TipoFuncionario = "barbeiro" | "faxineira" | "secretaria";

type Form = {
  nome: string;
  apelido: string;
  comissao: string;
  ativo: boolean;
  tipo: TipoFuncionario;
  comissoesServico: ComissaoServico[];
};

const EMPTY: Form = { nome: "", apelido: "", comissao: "40", ativo: true, tipo: "barbeiro", comissoesServico: [] };

type ContaModal = { open: boolean; barbeiro: Barbeiro | null };
type ContaForm = { email: string; senha: string };

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition";

const TIPO_LABELS: Record<TipoFuncionario, string> = {
  barbeiro: "Barbeiro",
  faxineira: "Faxineira",
  secretaria: "Secretária",
};

export default function FuncionariosPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Barbeiro | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [contaModal, setContaModal] = useState<ContaModal>({ open: false, barbeiro: null });
  const [contaForm, setContaForm] = useState<ContaForm>({ email: "", senha: "" });
  const [contaSaving, setContaSaving] = useState(false);
  const [contaErro, setContaErro] = useState("");
  const [removendoConta, setRemovendoConta] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [resBarb, resItens] = await Promise.all([
      fetch("/api/admin/barbeiros", { credentials: "include" }),
      fetch("/api/admin/itens", { credentials: "include" }),
    ]);
    const bJson = await resBarb.json();
    setBarbeiros(bJson.barbeiros ?? []);
    if (resItens.ok) {
      const iJson = await resItens.json();
      setItens((iJson.items ?? []).filter((i: Item) => i.status === "published"));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(EMPTY);
    setError("");
    setModal({ open: true, editing: null });
  }

  function openEdit(b: Barbeiro) {
    setForm({
      nome: b.nome,
      apelido: b.apelido ?? "",
      comissao: String(b.comissao),
      ativo: b.ativo,
      tipo: b.tipo ?? "barbeiro",
      comissoesServico: b.comissoesServico ?? [],
    });
    setError("");
    setModal({ open: true, editing: b });
  }

  function closeModal() { setModal({ open: false, editing: null }); }

  function setComissaoServico(servicoId: string, percentual: number) {
    setForm((f) => {
      const existing = f.comissoesServico.find((c) => c.servicoId === servicoId);
      if (existing) {
        return { ...f, comissoesServico: f.comissoesServico.map((c) => c.servicoId === servicoId ? { servicoId, percentual } : c) };
      }
      return { ...f, comissoesServico: [...f.comissoesServico, { servicoId, percentual }] };
    });
  }

  function getComissaoServico(servicoId: string): number {
    return form.comissoesServico.find((c) => c.servicoId === servicoId)?.percentual ?? 0;
  }

  async function handleSave() {
    if (!form.nome.trim()) { setError("Nome obrigatório"); return; }
    const comissao = Number(form.comissao);
    if (isNaN(comissao) || comissao < 0 || comissao > 100) { setError("Comissão deve ser entre 0 e 100"); return; }
    setSaving(true);
    setError("");
    try {
      const body = {
        nome: form.nome.trim(),
        apelido: form.apelido.trim() || undefined,
        comissao,
        ativo: form.ativo,
        tipo: form.tipo,
        comissoesServico: form.tipo === "barbeiro" ? form.comissoesServico.filter((c) => c.percentual > 0) : [],
      };
      if (modal.editing) {
        await fetch(`/api/admin/barbeiros/${modal.editing.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/admin/barbeiros", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      await load();
      closeModal();
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function openConta(b: Barbeiro) {
    setContaForm({ email: b.email ?? "", senha: "" });
    setContaErro("");
    setContaModal({ open: true, barbeiro: b });
  }

  async function handleSalvarConta() {
    if (!contaModal.barbeiro) return;
    if (!contaForm.email || !contaForm.senha) { setContaErro("Preencha e-mail e senha"); return; }
    if (contaForm.senha.length < 6) { setContaErro("Senha mínima de 6 caracteres"); return; }
    setContaSaving(true);
    setContaErro("");
    const res = await fetch(`/api/admin/barbeiros/${contaModal.barbeiro.id}/conta`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contaForm),
    });
    const json = await res.json();
    setContaSaving(false);
    if (!res.ok) { setContaErro(json.error ?? "Erro ao salvar"); return; }
    await load();
    setContaModal({ open: false, barbeiro: null });
  }

  async function handleRemoverConta(b: Barbeiro) {
    if (!confirm(`Remover acesso de ${b.nome}? O funcionário não conseguirá mais entrar.`)) return;
    setRemovendoConta(b.id);
    await fetch(`/api/admin/barbeiros/${b.id}/conta`, { method: "DELETE", credentials: "include" });
    await load();
    setRemovendoConta(null);
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover ${nome}? Agendamentos existentes não serão afetados.`)) return;
    setDeletingId(id);
    await fetch(`/api/admin/barbeiros/${id}`, { method: "DELETE", credentials: "include" });
    await load();
    setDeletingId(null);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Funcionários</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          <Plus size={16} /> Novo funcionário
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : barbeiros.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum funcionário cadastrado.</p>
      ) : (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg divide-y divide-[#1a1a1a]">
          {barbeiros.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#151515] transition">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold text-[#F5E6C8] text-sm">
                  {b.nome}{b.apelido ? <span className="text-gray-500 font-normal"> ({b.apelido})</span> : null}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="text-gray-400">{TIPO_LABELS[b.tipo ?? "barbeiro"]}</span>
                  {b.tipo !== "barbeiro" ? null : <>{" · "}Comissão <span className="text-[#b8944a] font-medium">{b.comissao}%</span></>}
                  {" · "}
                  <span className={b.ativo ? "text-green-400" : "text-gray-600"}>{b.ativo ? "Ativo" : "Inativo"}</span>
                  {b.uid && <>{" · "}<span className="text-blue-400">Portal ativo</span></>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openConta(b)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition"
                  title={b.uid ? "Atualizar acesso" : "Criar acesso ao portal"}
                >
                  <KeyRound size={12} />
                  {b.uid ? "Acesso" : "Criar acesso"}
                </button>
                {b.uid && (
                  <button
                    onClick={() => handleRemoverConta(b)}
                    disabled={removendoConta === b.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-orange-500 hover:text-orange-400 transition disabled:opacity-50"
                  >
                    {removendoConta === b.id ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                    Revogar
                  </button>
                )}
                <button
                  onClick={() => openEdit(b)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition"
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(b.id, b.nome)}
                  disabled={deletingId === b.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-red-500 hover:text-red-400 transition disabled:opacity-50"
                >
                  {deletingId === b.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal acesso ao portal */}
      {contaModal.open && contaModal.barbeiro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-md flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#F5E6C8]">Acesso ao portal</h2>
                <p className="text-xs text-gray-500 mt-0.5">{contaModal.barbeiro.nome}</p>
              </div>
              <button onClick={() => setContaModal({ open: false, barbeiro: null })} className="text-gray-500 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              {contaModal.barbeiro.uid
                ? "Atualize o e-mail ou senha de acesso."
                : "Crie um login para que o funcionário acesse o portal em /barbeiro."}
            </p>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">E-mail *</span>
                <input
                  type="email"
                  value={contaForm.email}
                  onChange={(e) => setContaForm((f) => ({ ...f, email: e.target.value }))}
                  className={inp}
                  placeholder="funcionario@email.com"
                  style={{ fontSize: 16 }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Senha (mín. 6 caracteres) *</span>
                <input
                  type="password"
                  value={contaForm.senha}
                  onChange={(e) => setContaForm((f) => ({ ...f, senha: e.target.value }))}
                  className={inp}
                  placeholder="••••••"
                  style={{ fontSize: 16 }}
                />
              </label>
            </div>

            {contaErro && <p className="text-red-400 text-xs">{contaErro}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={() => setContaModal({ open: false, barbeiro: null })} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">
                Cancelar
              </button>
              <button
                onClick={handleSalvarConta}
                disabled={contaSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50"
              >
                {contaSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Salvar acesso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar/editar funcionário */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-md flex flex-col gap-5 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#F5E6C8]">{modal.editing ? "Editar funcionário" : "Novo funcionário"}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Nome completo *</span>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className={inp}
                  placeholder="Ex: João Silva"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Apelido (opcional)</span>
                <input
                  value={form.apelido}
                  onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))}
                  className={inp}
                  placeholder="Ex: João"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Tipo</span>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoFuncionario }))}
                  className={inp}
                >
                  <option value="barbeiro">Barbeiro</option>
                  <option value="faxineira">Faxineira</option>
                  <option value="secretaria">Secretária</option>
                </select>
              </label>

              {form.tipo === "barbeiro" && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Comissão geral (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.comissao}
                    onChange={(e) => setForm((f) => ({ ...f, comissao: e.target.value }))}
                    className={inp}
                    placeholder="40"
                  />
                </label>
              )}

              {form.tipo === "barbeiro" && itens.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400 font-medium">Comissão por serviço (opcional)</span>
                  <p className="text-xs text-gray-600">Se preenchido, substitui a comissão geral para esse serviço.</p>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {itens.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="flex-1 text-xs text-[#F5E6C8] truncate">{item.titulo}</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={getComissaoServico(item.id) || ""}
                          onChange={(e) => setComissaoServico(item.id, Number(e.target.value))}
                          className="w-20 bg-[#0A0A0A] border border-[#2d2d2d] rounded px-2 py-1 text-xs text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition text-right"
                          placeholder="%"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm((f) => ({ ...f, ativo: !f.ativo }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.ativo ? "bg-[#b8944a]" : "bg-[#2d2d2d]"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.ativo ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-sm text-gray-400">{form.ativo ? "Ativo" : "Inativo"}</span>
              </label>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {modal.editing ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
