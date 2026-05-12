import "server-only";
import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

export interface PlanoAssinatura {
  id: string;
  nome: string;
  descricao: string;
  cortes: number;          // créditos por mês
  preco: number;           // centavos
  precoFormatado: string;
  stripePriceId: string;   // configurar via env var
}

export const PLANOS: PlanoAssinatura[] = [
  {
    id: "basico",
    nome: "Plano Básico",
    descricao: "Ideal para quem vai 1 vez por mês",
    cortes: 1,
    preco: 5990,
    precoFormatado: "R$ 59,90",
    stripePriceId: process.env.STRIPE_PRICE_BASICO ?? "",
  },
  {
    id: "mensal",
    nome: "Plano Mensal",
    descricao: "Para quem cuida do visual toda quinzena",
    cortes: 2,
    preco: 9990,
    precoFormatado: "R$ 99,90",
    stripePriceId: process.env.STRIPE_PRICE_MENSAL ?? "",
  },
  {
    id: "premium",
    nome: "Plano Premium",
    descricao: "Corte toda semana, sempre impecável",
    cortes: 4,
    preco: 17990,
    precoFormatado: "R$ 179,90",
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM ?? "",
  },
];

export function getPlanoPorId(id: string): PlanoAssinatura | undefined {
  return PLANOS.find((p) => p.id === id);
}

export function getPlanoPorPriceId(priceId: string): PlanoAssinatura | undefined {
  return PLANOS.find((p) => p.stripePriceId === priceId);
}
