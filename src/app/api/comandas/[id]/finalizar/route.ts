import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { finalizarComanda, getComanda } from "@/lib/comandas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => ({})) as { formaPagamento?: string };

  const comanda = await getComanda(id);
  if (!comanda) return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  if (comanda.status !== "aberta") {
    return NextResponse.json({ error: `Comanda já está ${comanda.status}` }, { status: 422 });
  }

  const finalizada = await finalizarComanda(id, { formaPagamento: body.formaPagamento });
  return NextResponse.json({ ok: true, comanda: finalizada });
}
