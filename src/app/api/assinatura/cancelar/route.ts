import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAssinaturaPorEmail, atualizarAssinatura } from "@/lib/assinaturas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST /api/assinatura/cancelar { email }
// Cancela ao final do período atual (cancel_at_period_end = true)
export async function POST(req: NextRequest) {
  if (!rateLimit(`cancelar:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  }

  const { email } = await req.json() as { email: string };
  if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });

  const assinatura = await getAssinaturaPorEmail(email.toLowerCase().trim());
  if (!assinatura) {
    return NextResponse.json({ error: "Nenhuma assinatura ativa encontrada" }, { status: 404 });
  }

  const stripe = getStripe();
  await stripe.subscriptions.update(assinatura.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await atualizarAssinatura(assinatura.id, { status: "cancelada" });

  return NextResponse.json({ ok: true, proximoVencimento: assinatura.proximoVencimento });
}
