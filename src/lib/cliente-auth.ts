import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { NextRequest } from "next/server";

export const CLIENTE_COOKIE = "cliente_session";
export const CLIENTE_SESSION_DURATION_S = 60 * 60 * 24 * 30; // 30 dias

export interface ClienteSession {
  assinaturaId: string;
  email: string;
  nome: string;
  iat: number; // issued at (ms)
}

function getSecret(): string {
  const s = process.env.CLIENTE_SESSION_SECRET;
  if (!s) throw new Error("CLIENTE_SESSION_SECRET não configurada");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function criarSessionToken(session: ClienteSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verificarSessionToken(token: string): ClienteSession | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = sign(payload);
    // comparação segura contra timing attacks
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as ClienteSession;
    const expMs = data.iat + CLIENTE_SESSION_DURATION_S * 1000;
    if (Date.now() > expMs) return null;
    return data;
  } catch {
    return null;
  }
}

export function getClienteSession(req: NextRequest): ClienteSession | null {
  const token = req.cookies.get(CLIENTE_COOKIE)?.value;
  if (!token) return null;
  return verificarSessionToken(token);
}

// utilitário para gerar secret seguro (usar uma vez no setup)
export function gerarSecret(): string {
  return randomBytes(48).toString("base64url");
}
