import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getBarbeiro, updateBarbeiro, deleteBarbeiro } from "@/lib/barbeiros";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const barbeiro = await getBarbeiro(id);
  if (!barbeiro) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ barbeiro });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = {};

  if (body.nome !== undefined) patch.nome = String(body.nome).trim().slice(0, 80);
  if (body.apelido !== undefined) patch.apelido = body.apelido ? String(body.apelido).trim().slice(0, 40) : null;
  if (body.foto !== undefined) patch.foto = body.foto ? String(body.foto).trim() : null;
  if (body.comissao !== undefined) patch.comissao = Math.min(100, Math.max(0, Number(body.comissao) || 0));
  if (body.ativo !== undefined) patch.ativo = Boolean(body.ativo);

  await updateBarbeiro(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteBarbeiro(id);
  return NextResponse.json({ ok: true });
}
