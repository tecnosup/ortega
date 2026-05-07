import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`set-claim:${getClientIp(req)}`, 3, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });
  }

  const { uid, email, secret } = await req.json();

  if (secret !== process.env.ADMIN_CLAIM_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  let targetUid = uid as string | undefined;

  if (!targetUid && email) {
    const user = await adminAuth.getUserByEmail(email as string);
    targetUid = user.uid;
  }

  if (!targetUid) {
    return NextResponse.json({ error: "Informe uid ou email" }, { status: 400 });
  }

  await adminAuth.setCustomUserClaims(targetUid, { admin: true });
  return NextResponse.json({ ok: true });
}
