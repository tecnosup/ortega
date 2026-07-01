import { NextRequest, NextResponse } from "next/server";
import { getItemById, updateItem, deleteItem } from "@/lib/admin-items";
import { getSessionUser } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const item = await getItemById(id);
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (body.titulo !== undefined) patch.titulo = String(body.titulo).trim().slice(0, 100);
  if (body.descricao !== undefined) patch.descricao = String(body.descricao).trim();
  if (body.imagem !== undefined) patch.imagem = body.imagem ? String(body.imagem).trim() : "";
  if (body.preco !== undefined) patch.preco = String(body.preco).trim();
  if (body.duracao !== undefined) patch.duracao = String(body.duracao).trim();
  if (body.categoriaId !== undefined) patch.categoriaId = body.categoriaId ? String(body.categoriaId).trim() : null;
  if (body.status !== undefined) patch.status = body.status === "draft" ? "draft" : "published";
  if (body.order !== undefined) patch.order = Number(body.order) || 0;
  await updateItem(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteItem(id);
  return NextResponse.json({ ok: true });
}
