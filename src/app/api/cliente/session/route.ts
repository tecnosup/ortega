import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  criarSessionToken,
  getClienteSession,
  CLIENTE_COOKIE,
  CLIENTE_SESSION_DURATION_S,
} from "@/lib/cliente-auth";
import type { Assinatura } from "@/lib/assinaturas";

export const dynamic = "force-dynamic";

// POST /api/cliente/session — login
export async function POST(req: NextRequest) {
  if (!rateLimit(`cliente-login:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um momento." }, { status: 429 });
  }

  const { email, senha } = await req.json() as { email?: string; senha?: string };

  if (!email || !senha) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
  }

  const emailNorm = String(email).toLowerCase().trim().slice(0, 200);
  const db = getAdminDb();

  const snap = await db
    .collection("assinaturas")
    .where("clienteEmail", "==", emailNorm)
    .where("status", "in", ["ativa", "inadimplente", "pausada"])
    .limit(1)
    .get();

  if (snap.empty) {
    // mensagem genérica para não vazar se o email existe
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  const assinatura = { id: snap.docs[0].id, ...snap.docs[0].data() } as Assinatura & { senhaHash?: string };

  if (!assinatura.senhaHash) {
    return NextResponse.json({ error: "Conta sem senha configurada. Entre em contato com a barbearia." }, { status: 403 });
  }

  const senhaOk = await compare(String(senha), assinatura.senhaHash);
  if (!senhaOk) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  const token = criarSessionToken({
    assinaturaId: assinatura.id,
    email: emailNorm,
    nome: assinatura.clienteNome,
    iat: Date.now(),
  });

  const res = NextResponse.json({ ok: true, nome: assinatura.clienteNome });
  res.cookies.set(CLIENTE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CLIENTE_SESSION_DURATION_S,
    path: "/",
  });
  return res;
}

// GET /api/cliente/session — verifica sessão ativa
export async function GET(req: NextRequest) {
  const session = getClienteSession(req);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, nome: session.nome, email: session.email });
}

// DELETE /api/cliente/session — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CLIENTE_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
