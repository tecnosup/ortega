import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getStripe, getPlanoPorId } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`checkout:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  }

  const { planoId, email, nome, telefone, senha } = await req.json() as {
    planoId: string;
    email: string;
    nome: string;
    telefone?: string;
    senha: string;
  };

  if (!planoId || !email || !nome || !senha) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  if (String(senha).length < 6) {
    return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres" }, { status: 400 });
  }

  const plano = getPlanoPorId(planoId);
  if (!plano) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  if (!plano.stripePriceId) {
    return NextResponse.json({ error: "Plano não configurado no Stripe" }, { status: 503 });
  }

  const emailSanitizado = String(email).slice(0, 200).toLowerCase().trim();
  const nomeSanitizado = String(nome).slice(0, 100);
  const telefoneSanitizado = telefone ? String(telefone).replace(/\D/g, "").slice(0, 15) : undefined;

  // Salva hash da senha no Firestore temporário — não passa pelo Stripe
  const senhaHash = await hash(String(senha), 12);
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

  // Persiste hash temporário associado ao session_id — TTL de 2h via campo expiresAt
  const db = getAdminDb();
  await db.collection("assinaturas_pendentes").doc(session.id).set({
    senhaHash,
    email: emailSanitizado,
    criadoEm: Date.now(),
    expiresAt: Date.now() + 2 * 60 * 60 * 1000,
  });

  return NextResponse.json({ url: session.url });
}
