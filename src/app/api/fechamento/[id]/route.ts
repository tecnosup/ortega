import { NextRequest, NextResponse } from "next/server";
import { excluirFechamento } from "@/lib/agendamentos";
import { getSessionUser, getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { descricao, valor, tipo } = await req.json();
  if (!descricao || !valor || isNaN(Number(valor)) || Number(valor) <= 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const db = getAdminDb();
  const doc = await db.collection("fechamentos").doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const dados = doc.data() as { extras?: unknown[]; totalServicos: number };
  const extra = {
    id: Date.now().toString(),
    descricao: String(descricao).slice(0, 200),
    valor: Number(valor),
    tipo: tipo === "produto" ? "produto" : "servico",
    criadoEm: Date.now(),
  };
  await db.collection("fechamentos").doc(id).update({
    extras: [...(dados.extras ?? []), extra],
    totalServicos: dados.totalServicos + extra.valor,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await excluirFechamento(id);
  return NextResponse.json({ ok: true });
}
