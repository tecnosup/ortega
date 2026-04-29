import { NextRequest, NextResponse } from "next/server";
import { fecharCaixaDia, listarFechamentos, listarAgendamentos } from "@/lib/agendamentos";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { data } = await req.json() as { data: string };
  if (!data) return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });

  const todos = await listarAgendamentos();
  const doDia = todos.filter((a) => a.data === data);
  const id = await fecharCaixaDia(data, doDia);
  return NextResponse.json({ id });
}

export async function GET() {
  const fechamentos = await listarFechamentos();
  return NextResponse.json(fechamentos);
}
