import { NextRequest, NextResponse } from "next/server";
import { criarAgendamento, listarAgendamentos } from "@/lib/agendamentos";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPushToAll, sendPushToBarbeiro } from "@/lib/web-push";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`agendamento:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
  }

  const body = await req.json();
  const { nome, telefone, servico, preco, data, horario, cupom, desconto, barbeiroId, barbeiroNome } = body;

  if (!nome || !telefone || !servico || !data || !horario) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const nomeSanitizado = String(nome).slice(0, 100);
  const telefoneSanitizado = String(telefone).replace(/\D/g, "").slice(0, 15);
  const servicoSanitizado = String(servico).slice(0, 100);

  if (telefoneSanitizado.length < 10) {
    return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
  }

  const payload: Parameters<typeof criarAgendamento>[0] = {
    nome: nomeSanitizado, telefone: telefoneSanitizado, servico: servicoSanitizado, preco: preco ?? "", data, horario,
  };
  if (cupom) payload.cupom = cupom;
  if (desconto !== undefined && desconto !== null) payload.desconto = desconto;
  if (barbeiroId) payload.barbeiroId = String(barbeiroId).slice(0, 64);
  if (barbeiroNome) payload.barbeiroNome = String(barbeiroNome).slice(0, 80);

  const id = await criarAgendamento(payload);

  // push em background — não bloqueia resposta ao cliente
  const dataFormatada = new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short", day: "numeric", month: "short",
  });
  const barbeiroLabel = barbeiroNome ? ` com ${barbeiroNome}` : "";
  const pushTitle = `✂️ Novo agendamento${barbeiroLabel}`;
  const pushBody = `${nomeSanitizado} · ${servicoSanitizado} · ${dataFormatada} às ${horario}`;
  sendPushToAll(pushTitle, pushBody).catch(() => {});
  if (payload.barbeiroId) {
    sendPushToBarbeiro(payload.barbeiroId, pushTitle, pushBody).catch(() => {});
  }

  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  const agendamentos = await listarAgendamentos();
  if (data) {
    return NextResponse.json(agendamentos.filter((a) => a.data === data && a.status !== "cancelado"));
  }
  return NextResponse.json(agendamentos);
}
