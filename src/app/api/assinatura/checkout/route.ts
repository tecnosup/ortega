import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPlanoPorId } from "@/lib/stripe";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`checkout:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  }

  const { planoId, email, nome, telefone } = await req.json() as {
    planoId: string;
    email: string;
    nome: string;
    telefone?: string;
  };

  if (!planoId || !email || !nome) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const plano = getPlanoPorId(planoId);
  if (!plano) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  if (!plano.stripePriceId) {
    return NextResponse.json({ error: "Plano não configurado no Stripe" }, { status: 503 });
  }

  const emailSanitizado = String(email).slice(0, 200).toLowerCase().trim();
  const nomeSanitizado = String(nome).slice(0, 100);
  const telefoneSanitizado = telefone ? String(telefone).replace(/\D/g, "").slice(0, 15) : undefined;

  const origin = req.nextUrl.origin;
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plano.stripePriceId, quantity: 1 }],
    customer_email: emailSanitizado,
    success_url: `${origin}/assinatura/confirmacao?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/assinatura`,
    metadata: {
      planoId,
      clienteNome: nomeSanitizado,
      clienteEmail: emailSanitizado,
      clienteTelefone: telefoneSanitizado ?? "",
      planoCortesTotal: String(plano.cortes),
    },
    subscription_data: {
      metadata: {
        planoId,
        clienteNome: nomeSanitizado,
        clienteEmail: emailSanitizado,
        clienteTelefone: telefoneSanitizado ?? "",
        planoCortesTotal: String(plano.cortes),
      },
    },
    allow_promotion_codes: true,
    locale: "pt-BR",
  });

  return NextResponse.json({ url: session.url });
}
