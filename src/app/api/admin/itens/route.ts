import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getItems, createItem } from "@/lib/admin-items";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await getItems();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const titulo = String(body.titulo ?? "").trim().slice(0, 100);
  if (!titulo) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  const id = await createItem({
    titulo,
    descricao: String(body.descricao ?? "").trim(),
    imagem: body.imagem ? String(body.imagem).trim() : "",
    preco: String(body.preco ?? "").trim(),
    duracao: String(body.duracao ?? "").trim(),
    categoriaId: body.categoriaId ? String(body.categoriaId).trim() : undefined,
    status: body.status === "draft" ? "draft" : "published",
    order: Number(body.order) || 0,
  });
  return NextResponse.json({ id }, { status: 201 });
}
