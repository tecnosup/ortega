import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getSessionUser } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// POST /api/admin/barbeiros/[id]/conta — cria ou atualiza login Firebase do barbeiro
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { email, senha } = (await req.json()) as { email: string; senha: string };

  if (!email || !senha || senha.length < 6) {
    return NextResponse.json({ error: "E-mail e senha (mín. 6 chars) obrigatórios" }, { status: 400 });
  }

  const db = getAdminDb();
  const auth = getAdminAuth();

  const barDoc = await db.collection("barbeiros").doc(id).get();
  if (!barDoc.exists) return NextResponse.json({ error: "Barbeiro não encontrado" }, { status: 404 });

  const barData = barDoc.data()!;
  const uid: string | undefined = barData.uid;

  try {
    if (uid) {
      // Atualiza credenciais do usuário já existente
      await auth.updateUser(uid, { email, password: senha });
    } else {
      // Cria usuário novo com custom claim barbeiro
      const created = await auth.createUser({ email, password: senha, displayName: barData.nome });
      await auth.setCustomUserClaims(created.uid, { barbeiro: true, barbeiroId: id });
      await db.collection("barbeiros").doc(id).update({ uid: created.uid, email });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao criar conta";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// DELETE /api/admin/barbeiros/[id]/conta — remove login Firebase do barbeiro
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getAdminDb();
  const auth = getAdminAuth();

  const barDoc = await db.collection("barbeiros").doc(id).get();
  if (!barDoc.exists) return NextResponse.json({ error: "Barbeiro não encontrado" }, { status: 404 });

  const uid: string | undefined = barDoc.data()!.uid;
  if (!uid) return NextResponse.json({ error: "Barbeiro sem conta" }, { status: 400 });

  await auth.deleteUser(uid);
  await db.collection("barbeiros").doc(id).update({ uid: null, email: null });
  return NextResponse.json({ ok: true });
}
