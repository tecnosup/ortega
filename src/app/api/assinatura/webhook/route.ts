import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPlanoPorPriceId } from "@/lib/stripe";
import {
  criarAssinatura,
  getAssinaturaPorStripeId,
  atualizarAssinatura,
} from "@/lib/assinaturas";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

// Stripe exige o body bruto para validar a assinatura
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Configuração incompleta" }, { status: 400 });
  }

  const rawBody = await req.arrayBuffer();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook signature inválida" }, { status: 400 });
  }

  try {
    await handleEvent(stripe, event);
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Campos que variam entre versões do SDK — acessamos via cast para evitar quebra de tipos
type SubRaw = Record<string, unknown>;

function getPeriodEnd(sub: SubRaw): number {
  // SDK dahlia: billing_cycle_anchor_config ou current_period_end dependendo da versão
  return ((sub.current_period_end ?? sub.billing_cycle_anchor ?? 0) as number) * 1000;
}

function getSubId(invoice: SubRaw): string | null {
  const s = invoice.subscription;
  if (!s) return null;
  if (typeof s === "string") return s;
  if (typeof s === "object" && s !== null && "id" in s) return (s as { id: string }).id;
  return null;
}

async function handleEvent(stripe: Stripe, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const sub = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as SubRaw;
      const meta = (sub.metadata ?? {}) as Record<string, string>;
      const items = (sub.items as { data: Array<{ price: { id: string } }> }).data;
      const priceId = items[0]?.price.id ?? "";
      const plano = getPlanoPorPriceId(priceId);
      const cortes = plano?.cortes ?? Number(meta.planoCortesTotal ?? 1);

      await criarAssinatura({
        stripeSubscriptionId: sub.id as string,
        stripeCustomerId: sub.customer as string,
        planoId: meta.planoId ?? plano?.id ?? "desconhecido",
        planoCortesTotal: cortes,
        cortesRestantes: cortes,
        status: "ativa",
        clienteNome: meta.clienteNome ?? "",
        clienteEmail: meta.clienteEmail ?? session.customer_email ?? "",
        clienteTelefone: meta.clienteTelefone || undefined,
        inicioEm: (sub.start_date as number) * 1000,
        proximoVencimento: getPeriodEnd(sub),
      });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as unknown as SubRaw;
      const subId = getSubId(invoice);
      if (!subId) break;

      const assinatura = await getAssinaturaPorStripeId(subId);
      if (!assinatura) break;

      if ((invoice.billing_reason as string) === "subscription_cycle") {
        const sub = await stripe.subscriptions.retrieve(subId) as unknown as SubRaw;
        await atualizarAssinatura(assinatura.id, {
          cortesRestantes: assinatura.planoCortesTotal,
          status: "ativa",
          proximoVencimento: getPeriodEnd(sub),
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as SubRaw;
      const subId = getSubId(invoice);
      if (!subId) break;

      const assinatura = await getAssinaturaPorStripeId(subId);
      if (assinatura) {
        await atualizarAssinatura(assinatura.id, { status: "inadimplente" });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as unknown as SubRaw;
      const assinatura = await getAssinaturaPorStripeId(sub.id as string);
      if (!assinatura) break;

      const stripeStatus = sub.status as string;
      const novoStatus = stripeStatus === "active" ? "ativa"
        : stripeStatus === "past_due" ? "inadimplente"
        : stripeStatus === "paused" ? "pausada"
        : assinatura.status;

      await atualizarAssinatura(assinatura.id, {
        status: novoStatus,
        proximoVencimento: getPeriodEnd(sub),
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const assinatura = await getAssinaturaPorStripeId(sub.id);
      if (assinatura) {
        await atualizarAssinatura(assinatura.id, {
          status: "cancelada",
          canceladaEm: Date.now(),
        });
      }
      break;
    }
  }
}
