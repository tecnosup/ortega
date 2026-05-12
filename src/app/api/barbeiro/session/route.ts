import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

const COOKIE = "barbeiro_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7 * 1000;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ error: "Token ausente" }, { status: 400 });

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    if (!decoded.barbeiro) {
      return NextResponse.json({ error: "Sem permissão de barbeiro" }, { status: 403 });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SEVEN_DAYS });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(session, true);
    if (!decoded.barbeiro) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    return NextResponse.json({ ok: true, barbeiroId: decoded.barbeiroId as string, uid: decoded.uid });
  } catch {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
