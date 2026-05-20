"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded-xl px-4 py-3 text-sm text-[#F5E6C8] placeholder-gray-700 focus:outline-none focus:border-[#b8944a]/60 transition w-full";

export default function ClientePerfilPage() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/cliente/perfil")
      .then((r) => r.json())
      .then((d) => {
        if (d.assinatura) {
          setNome(d.assinatura.clienteNome ?? "");
          setTelefone(d.assinatura.clienteTelefone ?? "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setMsg("");
    setSalvando(true);

    const body: Record<string, string> = { nome, telefone };
    if (novaSenha) { body.senhaAtual = senhaAtual; body.novaSenha = novaSenha; }

    const res = await fetch("/api/cliente/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSalvando(false);

    if (res.ok) {
      setMsg("Dados salvos com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
    } else {
      setErro(json.error ?? "Erro ao salvar");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#b8944a]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-[#F5E6C8]">Meu Perfil</h1>

      <form onSubmit={salvar} className="flex flex-col gap-5">
        <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#F5E6C8]">Dados pessoais</h2>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Nome completo</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={inp} style={{ fontSize: 16 }} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Telefone / WhatsApp</span>
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} type="tel" className={inp} style={{ fontSize: 16 }} />
          </label>
        </div>

        <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#F5E6C8]">Alterar senha <span className="text-gray-600 font-normal">(opcional)</span></h2>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Senha atual</span>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={inp}
              style={{ fontSize: 16 }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Nova senha</span>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className={inp}
              style={{ fontSize: 16 }}
            />
          </label>
        </div>

        {msg && <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3 text-green-400 text-sm">{msg}</div>}
        {erro && <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 text-red-400 text-sm">{erro}</div>}

        <button
          type="submit"
          disabled={salvando}
          className="w-full py-3.5 bg-[#b8944a] text-[#0A0A0A] font-bold rounded-xl hover:bg-[#c9a84c] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
