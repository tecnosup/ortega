import { NextRequest, NextResponse } from "next/server";
import { criarAgendamento, listarAgendamentos } from "@/lib/agendamentos";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`agendamento:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
  }

  const body = await req.json();
  const { nome, telefone, servico, preco, data, horario, cupom, desconto } = body;

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

  const id = await criarAgendamento(payload);
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
