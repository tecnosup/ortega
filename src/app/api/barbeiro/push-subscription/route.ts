import { NextRequest, NextResponse } from "next/server";
import { getBarbeiroSession } from "@/lib/firebase-admin";
import { saveBarbeiroSubscription, removeBarbeiroSubscription } from "@/lib/web-push";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sessao = await getBarbeiroSession(req);
  if (!sessao) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await saveBarbeiroSubscription({ endpoint, keys, criadoEm: Date.now(), barbeiroId: sessao.barbeiroId });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const sessao = await getBarbeiroSession(req);
  if (!sessao) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  await removeBarbeiroSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
