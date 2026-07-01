import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { getClienteSession } from "@/lib/cliente-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`cliente-cancelar:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  }

  const session = getClienteSession(req);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const db = getAdminDb();
  const doc = await db.collection("assinaturas").doc(session.assinaturaId).get();
  if (!doc.exists) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

  const data = doc.data()!;
  if (data.status !== "ativa") {
    return NextResponse.json({ error: "Assinatura não está ativa" }, { status: 400 });
  }

  const stripe = getStripe();
  await stripe.subscriptions.update(data.stripeSubscriptionId, { cancel_at_period_end: true });
  await db.collection("assinaturas").doc(session.assinaturaId).update({
    status: "cancelada",
    canceladaEm: Date.now(),
    atualizadoEm: Date.now(),
  });

  return NextResponse.json({ ok: true, proximoVencimento: data.proximoVencimento });
}
