import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Script one-off: define custom claim admin: true para um usuário.
// Chamar via POST com { uid, secret } onde secret == ADMIN_CLAIM_SECRET do .env
export async function POST(req: NextRequest) {
  const { uid, secret } = await req.json();

  if (secret !== process.env.ADMIN_CLAIM_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  await adminAuth.setCustomUserClaims(uid, { admin: true });
  return NextResponse.json({ ok: true });
}
