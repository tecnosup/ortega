import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getCategoriasServicos, createCategoriaServico } from "@/lib/admin-categorias-servicos";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categorias = await getCategoriasServicos();
  return NextResponse.json({ categorias });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const nome = String(body.nome ?? "").trim().slice(0, 60);
  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  const id = await createCategoriaServico(nome);
  return NextResponse.json({ id }, { status: 201 });
}
