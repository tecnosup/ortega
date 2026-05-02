import { NextRequest, NextResponse } from "next/server";
import { getLandingSettings } from "@/lib/admin-settings";

export async function POST(req: NextRequest) {
  const { nome, email, telefone, mensagem } = await req.json();

  const settings = await getLandingSettings();
  const numero = settings.whatsappNumber;

  const texto = `Olá! Meu nome é ${nome}.\nTelefone: ${telefone}\nE-mail: ${email}\n\n${mensagem}`;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

  return NextResponse.json({ ok: true, whatsappUrl: url });
}
