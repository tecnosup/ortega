import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { cancelarComanda, getComanda } from "@/lib/comandas";
import { devolverCredito } from "@/lib/assinaturas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const comanda = await getComanda(id);
  if (!comanda) return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  if (comanda.status !== "aberta") {
    return NextResponse.json({ error: `Comanda já está ${comanda.status}` }, { status: 422 });
  }

  const cancelada = await cancelarComanda(id);
  // Devolve crédito de assinatura, se aplicável (mesmo padrão do cancelamento de agendamento).
  if (comanda.cobertoPorAssinatura && comanda.assinaturaId) {
    await devolverCredito(comanda.assinaturaId).catch(() => {});
  }
  return NextResponse.json({ ok: true, comanda: cancelada });
}
