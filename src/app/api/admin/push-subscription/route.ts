import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase-admin";
import { saveSubscription, removeSubscription } from "@/lib/web-push";

export const dynamic = "force-dynamic";

async function autenticar() {
  const cookieStore = await cookies();
  const session = cookieStore.get("base_admin_session")?.value;
  if (!session) return false;
  try {
    await getAdminAuth().verifySessionCookie(session, true);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await autenticar())) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  await saveSubscription({ endpoint, keys, criadoEm: Date.now() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await autenticar())) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  await removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
