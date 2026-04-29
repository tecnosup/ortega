import { NextRequest, NextResponse } from "next/server";
import { criarAgendamento, listarAgendamentos } from "@/lib/agendamentos";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, telefone, servico, preco, data, horario, cupom, desconto } = body;

  if (!nome || !telefone || !servico || !data || !horario) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const payload: Parameters<typeof criarAgendamento>[0] = {
    nome, telefone, servico, preco: preco ?? "", data, horario,
  };
  if (cupom) payload.cupom = cupom;
  if (desconto !== undefined && desconto !== null) payload.desconto = desconto;

  const id = await criarAgendamento(payload);
  return NextResponse.json({ id });
}

export async function GET() {
  const agendamentos = await listarAgendamentos();
  return NextResponse.json(agendamentos);
}
