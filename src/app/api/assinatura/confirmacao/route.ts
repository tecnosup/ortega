import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAssinaturaPorStripeId } from "@/lib/assinaturas";

export const dynamic = "force-dynamic";

// GET /api/assinatura/confirmacao?session_id=xxx
// Retorna dados da assinatura criada via webhook para exibir na página de confirmação
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id obrigatório" }, { status: 400 });

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid" || !session.subscription) {
    return NextResponse.json({ error: "Pagamento não confirmado" }, { status: 402 });
  }

  const subId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription.id;

  // webhook pode ainda estar processando — tenta alguns milissegundos depois
  const assinatura = await getAssinaturaPorStripeId(subId);

  return NextResponse.json({
    ok: true,
    clienteNome: session.metadata?.clienteNome ?? "",
    planoId: session.metadata?.planoId ?? "",
    assinatura,
  });
}
