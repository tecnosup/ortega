import { NextRequest, NextResponse } from "next/server";
import { demofecharCaixaDia, demolistarFechamentos } from "@/lib/demo-agendamentos";

export async function POST(req: NextRequest) {
  const { data } = await req.json() as { data: string };
  if (!data) return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });
  const fechamento = demofecharCaixaDia(data);
  return NextResponse.json(fechamento);
}

export async function GET() {
  return NextResponse.json(demolistarFechamentos());
}
