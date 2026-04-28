import { NextRequest, NextResponse } from "next/server";
import { bloquearSlot, desbloquearSlot, listarSlotsBloqueados } from "@/lib/demo-agendamentos";

// GET /api/slots?data=YYYY-MM-DD → lista horários bloqueados pelo admin naquele dia
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });
  return NextResponse.json({ bloqueados: listarSlotsBloqueados(data) });
}

// POST /api/slots { data, horario, acao: "bloquear" | "desbloquear" }
export async function POST(req: NextRequest) {
  const { data, horario, acao } = await req.json() as { data: string; horario: string; acao: "bloquear" | "desbloquear" };
  if (!data || !horario || !acao) return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });

  if (acao === "bloquear") bloquearSlot(data, horario);
  else desbloquearSlot(data, horario);

  return NextResponse.json({ ok: true });
}
