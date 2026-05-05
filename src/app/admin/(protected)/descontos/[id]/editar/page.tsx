"use client";

export const dynamic = "force-dynamic";

import { useActionState, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { updateDescontoAction } from "../../actions";
import type { Desconto } from "@/lib/admin-descontos";

const inp = "bg-[#0A0A0A] border border-[#2d2d2d] rounded px-3 py-2 text-sm text-[#F5E6C8] placeholder-gray-600 focus:outline-none focus:border-[#b8944a] transition";

type Entidade = { id: string; titulo: string };

function toDatetimeLocal(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditarDescontoPage() {
  const params = useParams();
  const id = params.id as string;

  const [desconto, setDesconto] = useState<Desconto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<"item" | "produto">("item");
  const [itens, setItens] = useState<Entidade[]>([]);
  const [produtos, setProdutos] = useState<Entidade[]>([]);
  const [entityId, setEntityId] = useState("");
  const [state, formAction, pending] = useActionState(updateDescontoAction, null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/descontos/${id}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/entidades", { credentials: "include" }).then((r) => r.json()),
    ]).then(([dData, eData]) => {
      const d: Desconto = dData.desconto;
      setDesconto(d);
      setTipo(d.tipo);
      setEntityId(d.entityId);
      setItens(eData.itens ?? []);
      setProdutos(eData.produtos ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="text-gray-500 text-sm">Carregando...</p>;
  if (!desconto) return <p className="text-gray-500 text-sm">Desconto não encontrado.</p>;

  const lista = tipo === "item" ? itens : produtos;
  const entityTitulo = lista.find((e) => e.id === entityId)?.titulo ?? desconto.entityTitulo;

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5E6C8]">Editar desconto</h1>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={desconto.id} />
        <input type="hidden" name="entityTitulo" value={entityTitulo} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Tipo</label>
          <select name="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value as "item" | "produto"); setEntityId(""); }} className={inp}>
            <option value="item">Serviço</option>
            <option value="produto">Produto</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">{tipo === "item" ? "Serviço" : "Produto"}</label>
          <select name="entityId" value={entityId} onChange={(e) => setEntityId(e.target.value)} required className={inp}>
            <option value="">Selecione...</option>
            {lista.map((e) => <option key={e.id} value={e.id}>{e.titulo}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Desconto (%)</label>
          <input name="percentual" type="number" min={1} max={100} required defaultValue={desconto.percentual} className={inp} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Início</label>
          <input name="inicioAt" type="datetime-local" required defaultValue={toDatetimeLocal(desconto.inicioAt)} className={inp} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Fim</label>
          <input name="fimAt" type="datetime-local" required defaultValue={toDatetimeLocal(desconto.fimAt)} className={inp} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Status</label>
          <select name="ativo" defaultValue={String(desconto.ativo)} className={inp}>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>

        {state && !state.ok && <p className="text-sm text-red-400">{state.error}</p>}

        <button type="submit" disabled={pending} className="py-3 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition disabled:opacity-50">
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
