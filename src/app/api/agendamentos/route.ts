import { NextRequest, NextResponse } from "next/server";
import { democriarAgendamento, demolistarAgendamentos } from "@/lib/demo-agendamentos";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, telefone, servico, preco, data, horario } = body;

  if (!nome || !telefone || !servico || !data || !horario) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const id = democriarAgendamento({ nome, telefone, servico, preco: preco ?? "", data, horario });
  return NextResponse.json({ id });
}

export async function GET() {
  const agendamentos = demolistarAgendamentos();
  return NextResponse.json(agendamentos);
}
