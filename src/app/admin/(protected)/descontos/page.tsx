import { getDescontos } from "@/lib/admin-descontos";
import Link from "next/link";
import { Plus, Edit2, Tag } from "lucide-react";
import DeleteDescontoButton from "./DeleteDescontoButton";

export const dynamic = "force-dynamic";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusDesconto(d: { ativo: boolean; inicioAt: number; fimAt: number }) {
  const now = Date.now();
  if (!d.ativo) return { label: "Inativo", color: "text-gray-500" };
  if (now < d.inicioAt) return { label: "Agendado", color: "text-blue-400" };
  if (now > d.fimAt) return { label: "Expirado", color: "text-gray-500" };
  return { label: "Ativo", color: "text-green-400" };
}

export default async function DescontosPage() {
  const descontos = await getDescontos().catch(() => []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag size={22} className="text-[#b8944a]" />
          <h1 className="text-2xl font-bold text-[#F5E6C8]">Descontos</h1>
        </div>
        <Link
          href="/admin/descontos/novo"
          className="flex items-center gap-2 px-4 py-2 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          <Plus size={16} /> Novo desconto
        </Link>
      </div>

      {descontos.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum desconto cadastrado.</p>
      ) : (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg divide-y divide-[#1a1a1a]">
          {descontos.map((d) => {
            const status = statusDesconto(d);
            return (
              <div key={d.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#151515] transition">
                <div>
                  <p className="font-semibold text-[#F5E6C8] text-sm">
                    {d.entityTitulo}
                    <span className="ml-2 text-[#b8944a] font-bold">-{d.percentual}%</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className={`capitalize ${d.tipo === "item" ? "text-purple-400" : "text-sky-400"}`}>
                      {d.tipo === "item" ? "Serviço" : "Produto"}
                    </span>
                    {" · "}
                    <span className={status.color}>{status.label}</span>
                    {" · "}
                    {formatDate(d.inicioAt)} → {formatDate(d.fimAt)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/admin/descontos/${d.id}/editar`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-400 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition"
                  >
                    <Edit2 size={12} /> Editar
                  </Link>
                  <DeleteDescontoButton id={d.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
