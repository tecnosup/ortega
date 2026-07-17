"use client";

export const dynamic = "force-dynamic";

import { useActionState, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Select from "@/components/ui/Select";
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
  const [ativo, setAtivo] = useState("true");
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
      setAtivo(String(d.ativo));
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

        {/* Select do sistema é <button>: o valor vai pro formData por input
            escondido. O `required` do HTML se perde, mas a action valida com zod
            e o erro aparece no rodapé do form. */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Tipo</label>
          <input type="hidden" name="tipo" value={tipo} />
          <Select
            value={tipo}
            onChange={(v) => { setTipo(v as "item" | "produto"); setEntityId(""); }}
            options={[{ value: "item", label: "Serviço" }, { value: "produto", label: "Produto" }]}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">{tipo === "item" ? "Serviço" : "Produto"}</label>
          <input type="hidden" name="entityId" value={entityId} />
          <Select
            value={entityId}
            onChange={setEntityId}
            options={lista.map((e) => ({ value: e.id, label: e.titulo }))}
            placeholder="Selecione..."
            searchable
            searchPlaceholder={tipo === "item" ? "Buscar serviço..." : "Buscar produto..."}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Desconto (%)</label>
          <input name="percentual" type="number" min={1} max={100} required defaultValue={desconto.percentual} spellCheck={false} className={inp} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Início</label>
          <input name="inicioAt" type="datetime-local" required defaultValue={toDatetimeLocal(desconto.inicioAt)} spellCheck={false} className={inp} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Fim</label>
          <input name="fimAt" type="datetime-local" required defaultValue={toDatetimeLocal(desconto.fimAt)} spellCheck={false} className={inp} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Status</label>
          <input type="hidden" name="ativo" value={ativo} />
          <Select
            value={ativo}
            onChange={setAtivo}
            options={[{ value: "true", label: "Ativo" }, { value: "false", label: "Inativo" }]}
          />
        </div>

        {state && !state.ok && <p className="text-sm text-red-400">{state.error}</p>}

        <button type="submit" disabled={pending} className="py-3 bg-[#b8944a] text-[#0A0A0A] font-bold text-sm rounded hover:bg-[#c9a84c] transition disabled:opacity-50">
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
