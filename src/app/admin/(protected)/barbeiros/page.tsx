"use client";

import { useEffect, useRef, useState } from "react";
import {
  Users, Plus, Edit2, Trash2, X, Check, Loader2, KeyRound, Unlink,
  Camera, Phone, MapPin, ChevronDown, ChevronUp, Filter,
  UserCheck, UserX, Settings2, Tag,
} from "lucide-react";
import type { Barbeiro, ComissaoServico } from "@/lib/barbeiros-types";
import type { Item } from "@/lib/admin-items";
import type { CategoriaFuncionario } from "@/lib/categorias-funcionarios";

type Form = {
  nome: string;
  apelido: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  endereco: string;
  comissao: string;
  ativo: boolean;
  tipo: string;
  comissoesServico: ComissaoServico[];
  foto: string;
};

const EMPTY: Form = {
  nome: "", apelido: "", telefone: "", cpf: "", dataNascimento: "",
  endereco: "", comissao: "40", ativo: true, tipo: "",
  comissoesServico: [], foto: "",
};

type ContaModal = { open: boolean; barbeiro: Barbeiro | null };
type ContaForm = { email: string; senha: string };

const inp =
  "bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition w-full";

function maskCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, e) =>
    e ? `${a}.${b}.${c}-${e}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a
  );
}

function maskTel(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a);
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a);
}

export default function FuncionariosPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFuncionario[]>([]);
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroAtivo, setFiltroAtivo] = useState<"todos" | "ativo" | "inativo">("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingPresenca, setTogglingPresenca] = useState<string | null>(null);
  const [tiposOpen, setTiposOpen] = useState(false);
  const [novoTipo, setNovoTipo] = useState("");
  const [tipoSaving, setTipoSaving] = useState(false);
  const [tipoErro, setTipoErro] = useState("");
  const [tipoEditId, setTipoEditId] = useState<string | null>(null);
  const [tipoEditNome, setTipoEditNome] = useState("");
  const [tipoDeletingId, setTipoDeletingId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const [resBarb, resItens, resCat] = await Promise.all([
      fetch("/api/admin/barbeiros", { credentials: "include" }),
      fetch("/api/admin/itens", { credentials: "include" }),
      fetch("/api/admin/categorias-funcionarios", { credentials: "include" }),
    ]);
    const bJson = await resBarb.json();
    setBarbeiros(bJson.barbeiros ?? []);
    if (resItens.ok) {
      const iJson = await resItens.json();
      setItens((iJson.items ?? []).filter((i: Item) => i.status === "published"));
    }
    if (resCat.ok) {
      const cJson = await resCat.json();
      setCategorias(cJson.categorias ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(EMPTY);
    setError("");
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
    setModal({ open: true, editing: null });
  }

  function openEdit(b: Barbeiro) {
    setForm({
      nome: b.nome,
      apelido: b.apelido ?? "",
      telefone: b.telefone ?? "",
      cpf: b.cpf ?? "",
      dataNascimento: b.dataNascimento ?? "",
      endereco: b.endereco ?? "",
      comissao: String(b.comissao),
      ativo: b.ativo,
      tipo: b.tipo ?? "",
      comissoesServico: b.comissoesServico ?? [],
      foto: b.foto ?? "",
    });
    setError("");
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
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

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "ortega/funcionarios");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, foto: data.url }));
      } else {
        setUploadError(data.error ?? "Erro no upload");
      }
    } catch {
      setUploadError("Erro de rede");
    } finally {
      setUploading(false);
    }
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
        foto: form.foto || undefined,
        telefone: form.telefone.trim() || undefined,
        cpf: form.cpf.trim() || undefined,
        dataNascimento: form.dataNascimento.trim() || undefined,
        endereco: form.endereco.trim() || undefined,
        comissao,
        ativo: form.ativo,
        tipo: form.tipo || undefined,
        comissoesServico: form.comissoesServico.filter((c) => c.percentual > 0),
      };
      if (modal.editing) {
        await fetch(`/api/admin/barbeiros/${modal.editing.id}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/admin/barbeiros", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
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
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(contaForm),
    });
    const json = await res.json();
    setContaSaving(false);
    if (!res.ok) { setContaErro(json.error ?? "Erro ao salvar"); return; }
    await load();
    setContaModal({ open: false, barbeiro: null });
  }

  async function handleRemoverConta(b: Barbeiro) {
    if (!confirm(`Remover acesso de ${b.nome}?`)) return;
    setRemovendoConta(b.id);
    await fetch(`/api/admin/barbeiros/${b.id}/conta`, { method: "DELETE", credentials: "include" });
    await load();
    setRemovendoConta(null);
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover ${nome}?`)) return;
    setDeletingId(id);
    await fetch(`/api/admin/barbeiros/${id}`, { method: "DELETE", credentials: "include" });
    await load();
    setDeletingId(null);
  }

  async function togglePresenca(b: Barbeiro) {
    setTogglingPresenca(b.id);
    await fetch(`/api/admin/barbeiros/${b.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presenteHoje: !b.presenteHoje }),
    });
    setBarbeiros((prev) => prev.map((x) => x.id === b.id ? { ...x, presenteHoje: !x.presenteHoje } : x));
    setTogglingPresenca(null);
  }

  async function handleCriarTipo() {
    if (!novoTipo.trim()) { setTipoErro("Nome obrigatório"); return; }
    setTipoSaving(true);
    setTipoErro("");
    const res = await fetch("/api/admin/categorias-funcionarios", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: novoTipo.trim() }),
    });
    setTipoSaving(false);
    if (!res.ok) { setTipoErro("Erro ao criar"); return; }
    setNovoTipo("");
    await load();
  }

  async function handleSalvarTipoEdit() {
    if (!tipoEditNome.trim() || !tipoEditId) return;
    await fetch(`/api/admin/categorias-funcionarios/${tipoEditId}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: tipoEditNome.trim() }),
    });
    setTipoEditId(null);
    await load();
  }

  async function handleDeleteTipo(id: string) {
    if (!confirm("Remover este tipo?")) return;
    setTipoDeletingId(id);
    await fetch(`/api/admin/categorias-funcionarios/${id}`, { method: "DELETE", credentials: "include" });
    setTipoDeletingId(null);
    await load();
  }

  const barbeirosFiltered = barbeiros
    .filter((b) => filtroTipo === "todos" || b.tipo === filtroTipo)
    .filter((b) => filtroAtivo === "todos" || (filtroAtivo === "ativo" ? b.ativo : !b.ativo));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 px-2 sm:px-0">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Funcionários</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          <Plus size={15} /> Novo funcionário
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 text-gray-500 text-xs"><Filter size={12} /></div>

          <button
            onClick={() => setFiltroTipo("todos")}
            className={`px-3 py-1 text-xs rounded-full border transition ${filtroTipo === "todos" ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-[#2d2d2d] text-gray-500 hover:border-[#444]"}`}
          >
            Todos
          </button>

          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFiltroTipo(cat.nome)}
              className={`px-3 py-1 text-xs rounded-full border transition ${filtroTipo === cat.nome ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-[#2d2d2d] text-gray-500 hover:border-[#444]"}`}
            >
              {cat.nome}
            </button>
          ))}

          <button
            onClick={() => setTiposOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition ${tiposOpen ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-dashed border-[#3d3d3d] text-gray-500 hover:border-[#b8944a] hover:text-[#b8944a]"}`}
          >
            <Tag size={11} /> Gerenciar tipos
          </button>

          <div className="w-px h-4 bg-[#2d2d2d]" />

          {(["todos", "ativo", "inativo"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroAtivo(s)}
              className={`px-3 py-1 text-xs rounded-full border transition ${filtroAtivo === s ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10" : "border-[#2d2d2d] text-gray-500 hover:border-[#444]"}`}
            >
              {s === "todos" ? "Todos" : s === "ativo" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>

        {tiposOpen && (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium">Gerenciar tipos de funcionário</p>
            <div className="flex gap-2">
              <input
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCriarTipo()}
                placeholder="Ex: Barbeiro, Manicure…"
                className={inp}
                style={{ fontSize: 16 }}
              />
              <button
                onClick={handleCriarTipo}
                disabled={tipoSaving}
                className="px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50 shrink-0"
              >
                {tipoSaving ? <Loader2 size={14} className="animate-spin" /> : "Adicionar"}
              </button>
            </div>
            {tipoErro && <p className="text-red-400 text-xs">{tipoErro}</p>}

            {categorias.length === 0 ? (
              <p className="text-gray-600 text-xs">Nenhum tipo criado ainda.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {categorias.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg">
                    {tipoEditId === cat.id ? (
                      <>
                        <input
                          value={tipoEditNome}
                          onChange={(e) => setTipoEditNome(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSalvarTipoEdit()}
                          className="flex-1 bg-transparent text-sm text-[#F5E6C8] focus:outline-none"
                          autoFocus
                        />
                        <button onClick={handleSalvarTipoEdit} className="text-green-400 hover:text-green-300 transition"><Check size={14} /></button>
                        <button onClick={() => setTipoEditId(null)} className="text-gray-500 hover:text-white transition"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-[#F5E6C8]">{cat.nome}</span>
                        <button onClick={() => { setTipoEditId(cat.id); setTipoEditNome(cat.nome); }} className="text-gray-500 hover:text-[#b8944a] transition"><Edit2 size={13} /></button>
                        <button
                          onClick={() => handleDeleteTipo(cat.id)}
                          disabled={tipoDeletingId === cat.id}
                          className="text-gray-500 hover:text-red-400 transition disabled:opacity-50"
                        >
                          {tipoDeletingId === cat.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : barbeirosFiltered.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum funcionário encontrado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {barbeirosFiltered.map((b) => {
            const expanded = expandedId === b.id;
            return (
              <div key={b.id} className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#2d2d2d] bg-[#1a1a1a] flex items-center justify-center">
                    {b.foto ? (
                      <img src={b.foto} alt={b.nome} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-[#b8944a]">{b.nome.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-semibold text-[#F5E6C8] text-sm truncate">
                        {b.nome}
                        {b.apelido && <span className="text-gray-500 font-normal"> ({b.apelido})</span>}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${b.ativo ? "border-green-800 text-green-400 bg-green-950/40" : "border-[#2d2d2d] text-gray-600"}`}>
                        {b.ativo ? "Ativo" : "Inativo"}
                      </span>
                      {b.uid && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-blue-800 text-blue-400 bg-blue-950/40">Portal</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                      {b.tipo && <span className="text-xs text-gray-500">{b.tipo}</span>}
                      <span className="text-xs text-gray-500">Comissão <span className="text-[#b8944a]">{b.comissao}%</span></span>
                      {b.email && <span className="text-xs text-gray-500 truncate max-w-[160px]">{b.email}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => togglePresenca(b)}
                      disabled={togglingPresenca === b.id}
                      title={b.presenteHoje ? "Marcar ausente" : "Marcar presente"}
                      className={`p-1.5 rounded-lg border transition ${b.presenteHoje ? "border-green-700 text-green-400 bg-green-950/30" : "border-[#2d2d2d] text-gray-600 hover:border-green-700 hover:text-green-400"}`}
                    >
                      {togglingPresenca === b.id ? <Loader2 size={14} className="animate-spin" /> : b.presenteHoje ? <UserCheck size={14} /> : <UserX size={14} />}
                    </button>
                    <button
                      onClick={() => setExpandedId(expanded ? null : b.id)}
                      className="p-1.5 rounded-lg border border-[#2d2d2d] text-gray-500 hover:text-white hover:border-[#444] transition"
                    >
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-[#1a1a1a] px-4 py-4 flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-gray-400">
                      {b.telefone && (
                        <div className="flex items-center gap-1.5"><Phone size={11} className="text-gray-600" />{b.telefone}</div>
                      )}
                      {b.cpf && (
                        <div className="flex items-center gap-1.5"><Settings2 size={11} className="text-gray-600" />CPF: {b.cpf}</div>
                      )}
                      {b.dataNascimento && (
                        <div className="flex items-center gap-1.5"><Settings2 size={11} className="text-gray-600" />Nasc.: {b.dataNascimento}</div>
                      )}
                      {b.endereco && (
                        <div className="flex items-center gap-1.5 col-span-full"><MapPin size={11} className="text-gray-600 shrink-0" />{b.endereco}</div>
                      )}
                    </div>

                    <div className="bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2.5 flex flex-col gap-1">
                      <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">Acesso ao portal</p>
                      {b.uid ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-xs text-[#F5E6C8]">{b.email ?? "—"}</span>
                          <span className="text-[10px] text-green-400 bg-green-950/40 border border-green-800 px-1.5 py-0.5 rounded-full">Ativo</span>
                          <span className="text-xs text-gray-600">Senha: ••••••</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">Sem acesso configurado</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openConta(b)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition"
                      >
                        <KeyRound size={12} />
                        {b.uid ? "Atualizar acesso" : "Criar acesso"}
                      </button>
                      {b.uid && (
                        <button
                          onClick={() => handleRemoverConta(b)}
                          disabled={removendoConta === b.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-orange-500 hover:text-orange-400 transition disabled:opacity-50"
                        >
                          {removendoConta === b.id ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                          Revogar
                        </button>
                      )}
                      <button
                        onClick={() => { setExpandedId(null); openEdit(b); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.nome)}
                        disabled={deletingId === b.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-red-500 hover:text-red-400 transition disabled:opacity-50"
                      >
                        {deletingId === b.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {contaModal.open && contaModal.barbeiro && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
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
              {contaModal.barbeiro.uid ? "Atualize o e-mail ou senha de acesso." : "Crie um login para que o funcionário acesse o portal em /barbeiro."}
            </p>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">E-mail *</span>
                <input
                  type="email" value={contaForm.email}
                  onChange={(e) => setContaForm((f) => ({ ...f, email: e.target.value }))}
                  className={inp} placeholder="funcionario@email.com" style={{ fontSize: 16 }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Senha (mín. 6 caracteres) *</span>
                <input
                  type="password" value={contaForm.senha}
                  onChange={(e) => setContaForm((f) => ({ ...f, senha: e.target.value }))}
                  className={inp} placeholder="••••••" style={{ fontSize: 16 }}
                />
              </label>
            </div>
            {contaErro && <p className="text-red-400 text-xs">{contaErro}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setContaModal({ open: false, barbeiro: null })} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
              <button
                onClick={handleSalvarConta} disabled={contaSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition disabled:opacity-50"
              >
                {contaSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Salvar acesso
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-[#111] border border-[#2d2d2d] rounded-t-2xl sm:rounded-xl w-full max-w-lg flex flex-col gap-0 max-h-[92dvh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d] shrink-0">
              <h2 className="font-bold text-[#F5E6C8]">{modal.editing ? "Editar funcionário" : "Novo funcionário"}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto">

              <div className="flex flex-col items-center gap-3">
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#2d2d2d] bg-[#1a1a1a] flex items-center justify-center">
                    {form.foto ? (
                      <img src={form.foto} alt="foto" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={24} className="text-gray-600" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#b8944a] rounded-full flex items-center justify-center hover:bg-[#c9a84c] transition disabled:opacity-50"
                  >
                    {uploading ? <Loader2 size={12} className="animate-spin text-[#0A0A0A]" /> : <Camera size={12} className="text-[#0A0A0A]" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                </div>
                {form.foto && (
                  <button onClick={() => setForm((f) => ({ ...f, foto: "" }))} className="text-xs text-gray-500 hover:text-red-400 transition">Remover foto</button>
                )}
                {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs text-gray-400 font-medium">Nome completo *</span>
                  <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className={inp} placeholder="Ex: João Silva" style={{ fontSize: 16 }} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Apelido</span>
                  <input value={form.apelido} onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))} className={inp} placeholder="Ex: João" style={{ fontSize: 16 }} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Telefone</span>
                  <input value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: maskTel(e.target.value) }))} className={inp} placeholder="(11) 99999-9999" inputMode="numeric" style={{ fontSize: 16 }} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">CPF</span>
                  <input value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))} className={inp} placeholder="000.000.000-00" inputMode="numeric" style={{ fontSize: 16 }} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-medium">Data de nascimento</span>
                  <input type="date" value={form.dataNascimento} onChange={(e) => setForm((f) => ({ ...f, dataNascimento: e.target.value }))} className={inp} style={{ fontSize: 16 }} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs text-gray-400 font-medium">Endereço</span>
                  <input value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} className={inp} placeholder="Rua, número, bairro" style={{ fontSize: 16 }} />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Tipo</span>
                <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className={inp} style={{ fontSize: 16 }}>
                  <option value="">Sem tipo</option>
                  {categorias.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Comissão geral (%)</span>
                <input type="number" min={0} max={100} value={form.comissao} onChange={(e) => setForm((f) => ({ ...f, comissao: e.target.value }))} className={inp} placeholder="40" style={{ fontSize: 16 }} />
              </label>

              {itens.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400 font-medium">Comissão por serviço <span className="text-gray-600 font-normal">(substitui a geral)</span></span>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {itens.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="flex-1 text-xs text-[#F5E6C8] truncate">{item.titulo}</span>
                        <input
                          type="number" min={0} max={100}
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

              {error && <p className="text-red-400 text-xs">{error}</p>}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#2d2d2d] shrink-0">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
              <button
                onClick={handleSave} disabled={saving}
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
