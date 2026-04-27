import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const COOKIE = "base_admin_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7 * 1000;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ error: "Token ausente" }, { status: 400 });

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.admin) {
      return NextResponse.json({ error: "Sem permissão de admin" }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SEVEN_DAYS });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, sessionCookie, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: SEVEN_DAYS / 1000,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  const session = req.cookies.get(COOKIE)?.value;
  if (!session) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });

  try {
    await adminAuth.verifySessionCookie(session, true);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
