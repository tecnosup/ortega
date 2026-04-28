import { NextRequest, NextResponse } from "next/server";

// DEMO MODE: resposta simulada — plugar fluxo real após aprovação do cliente
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: true });
}
