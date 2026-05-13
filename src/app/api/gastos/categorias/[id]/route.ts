import { NextRequest, NextResponse } from "next/server";
import { atualizarCategoria, excluirCategoria } from "@/lib/gastos-categorias";
import { getSessionUser } from "@/lib/firebase-admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { nome, cor, ordem } = body as { nome?: string; cor?: string; ordem?: number };
  const data: { nome?: string; cor?: string; ordem?: number } = {};
  if (nome !== undefined) data.nome = nome;
  if (cor !== undefined) data.cor = cor;
  if (ordem !== undefined) data.ordem = ordem;

  await atualizarCategoria(id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await excluirCategoria(id);
  return NextResponse.json({ ok: true });
}
