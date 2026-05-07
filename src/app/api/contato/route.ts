import { NextRequest, NextResponse } from "next/server";
import { getLandingSettings } from "@/lib/admin-settings";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`contato:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
  }

  const { nome, email, telefone, mensagem } = await req.json();

  const settings = await getLandingSettings();
  const numero = settings.whatsappNumber;

  const texto = `Olá! Meu nome é ${nome}.\nTelefone: ${telefone}\nE-mail: ${email}\n\n${mensagem}`;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

  return NextResponse.json({ ok: true, whatsappUrl: url });
}
