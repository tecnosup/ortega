import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  // TODO: plugar fluxo de conversão — WhatsApp, gateway, agendamento, e-mail, etc.
  return NextResponse.json({ ok: true });
}
