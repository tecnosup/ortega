import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verificarSessionToken, CLIENTE_COOKIE } from "@/lib/cliente-auth";
import { getAssinaturaDoCliente } from "@/lib/cliente-auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { PLANOS_PUBLICOS } from "@/lib/stripe-tipos";
import type { Agendamento } from "@/lib/agendamentos-types";
import { Scissors, Calendar, CreditCard, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

function formatarData(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function formatarDataCurta(s: string) {
  const [ano, mes, dia] = s.split("-");
  return `${dia}/${mes}/${ano}`;
}

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  pendente:       { label: "Pendente",    cor: "text-yellow-400 bg-yellow-900/20 border-yellow-700/30" },
  confirmado:     { label: "Confirmado",  cor: "text-green-400 bg-green-900/20 border-green-700/30" },
  cancelado:      { label: "Cancelado",   cor: "text-red-400 bg-red-900/20 border-red-700/30" },
  concluido:      { label: "Concluído",   cor: "text-gray-400 bg-[#1a1a1a] border-[#2d2d2d]" },
  nao_compareceu: { label: "Não veio",    cor: "text-orange-400 bg-orange-900/20 border-orange-700/30" },
};

export default async function ClienteDashboard() {
  const jar = await cookies();
  const token = jar.get(CLIENTE_COOKIE)?.value;
  const session = token ? verificarSessionToken(token) : null;
  if (!session) redirect("/cliente/login?msg=sessao-expirada");

  const assinatura = await getAssinaturaDoCliente(session);
  if (!assinatura) redirect("/cliente/login?msg=sessao-expirada");

  const plano = PLANOS_PUBLICOS.find((p) => p.id === assinatura.planoId);
  const creditosUsados = assinatura.planoCortesTotal - assinatura.cortesRestantes;
  const pct = Math.round((creditosUsados / assinatura.planoCortesTotal) * 100);

  // Busca agendamentos futuros do cliente
  const db = getAdminDb();
  const hoje = new Date();
  const hojeKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const snap = await db
    .collection("agendamentos")
    .where("telefone", "==", assinatura.clienteTelefone ?? "")
    .where("data", ">=", hojeKey)
    .orderBy("data", "asc")
    .limit(20)
    .get();

  const proximos: Agendamento[] = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Agendamento))
    .filter((a) => a.status === "pendente" || a.status === "confirmado")
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-[#F5E6C8]">Olá, {assinatura.clienteNome.split(" ")[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Aqui está o resumo da sua assinatura</p>
      </div>

      {/* Card de créditos */}
      <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Plano</p>
            <p className="font-bold text-[#b8944a] mt-0.5">{plano?.nome ?? assinatura.planoId}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            assinatura.status === "ativa" ? "text-green-400 bg-green-900/20 border-green-700/30" :
            assinatura.status === "inadimplente" ? "text-red-400 bg-red-900/20 border-red-700/30" :
            "text-gray-400 bg-[#1a1a1a] border-[#2d2d2d]"
          }`}>
            {assinatura.status === "ativa" ? "Ativa" : assinatura.status === "inadimplente" ? "Inadimplente" : "Pausada"}
          </span>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Scissors size={14} className="text-[#b8944a]" />
              Cortes disponíveis este mês
            </div>
            <span className="text-sm font-bold text-[#F5E6C8]">
              {assinatura.cortesRestantes}
              <span className="text-gray-600 font-normal"> / {assinatura.planoCortesTotal}</span>
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#b8944a] rounded-full transition-all"
              style={{ width: `${Math.max(100 - pct, 0)}%` }}
            />
          </div>
          {assinatura.cortesRestantes === 0 ? (
            <p className="text-xs text-gray-600">Todos os créditos utilizados este mês</p>
          ) : (
            <p className="text-xs text-gray-600">
              Renova em <span className="text-[#F5E6C8]">{formatarData(assinatura.proximoVencimento)}</span>
            </p>
          )}
        </div>

        <div className="px-5 pb-5">
          <a
            href="/cliente/agendar"
            className={`w-full py-3 rounded-xl font-bold text-sm text-center block transition ${
              assinatura.cortesRestantes > 0 && assinatura.status === "ativa"
                ? "bg-[#b8944a] text-[#0A0A0A] hover:bg-[#c9a84c]"
                : "bg-[#1a1a1a] text-gray-600 cursor-not-allowed pointer-events-none"
            }`}
          >
            {assinatura.cortesRestantes > 0 && assinatura.status === "ativa"
              ? "Agendar corte"
              : "Sem créditos disponíveis"}
          </a>
        </div>
      </div>

      {/* Próximos agendamentos */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#F5E6C8] flex items-center gap-1.5">
            <Calendar size={14} className="text-[#b8944a]" /> Próximos agendamentos
          </h2>
          <a href="/cliente/agendamentos" className="text-xs text-gray-600 hover:text-[#b8944a] transition flex items-center gap-0.5">
            Ver todos <ChevronRight size={12} />
          </a>
        </div>

        {proximos.length === 0 ? (
          <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-5 text-center">
            <p className="text-sm text-gray-500">Nenhum agendamento futuro</p>
          </div>
        ) : (
          proximos.map((ag) => {
            const st = STATUS_LABEL[ag.status] ?? STATUS_LABEL.pendente;
            return (
              <div key={ag.id} className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-[#F5E6C8]">{ag.servico}</p>
                  <p className="text-xs text-gray-500">
                    {formatarDataCurta(ag.data)} às {ag.horario}
                    {ag.barbeiroNome ? ` · ${ag.barbeiroNome}` : ""}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded border shrink-0 ${st.cor}`}>
                  {st.label}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Atalhos */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/cliente/assinatura" className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex flex-col gap-2 hover:border-[#b8944a]/40 transition group">
          <CreditCard size={18} className="text-[#b8944a]" />
          <p className="text-xs font-medium text-[#F5E6C8] group-hover:text-[#b8944a] transition">Minha assinatura</p>
          <p className="text-[10px] text-gray-600">Plano, vencimento e cancelamento</p>
        </a>
        <a href="/cliente/agendamentos" className="bg-[#111] border border-[#2d2d2d] rounded-xl p-4 flex flex-col gap-2 hover:border-[#b8944a]/40 transition group">
          <Calendar size={18} className="text-[#b8944a]" />
          <p className="text-xs font-medium text-[#F5E6C8] group-hover:text-[#b8944a] transition">Histórico</p>
          <p className="text-[10px] text-gray-600">Todos os seus cortes</p>
        </a>
      </div>
    </div>
  );
}
