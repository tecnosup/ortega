import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { updateCategoriaServico, deleteCategoriaServico } from "@/lib/admin-categorias-servicos";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const nome = String(body.nome ?? "").trim().slice(0, 60);
  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  await updateCategoriaServico(id, nome);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteCategoriaServico(id);
  return NextResponse.json({ ok: true });
}
