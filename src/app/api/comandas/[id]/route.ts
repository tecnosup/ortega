import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { atualizarComanda, excluirComanda, getComanda } from "@/lib/comandas";
import { calcularTotalItens, type Comanda } from "@/lib/comandas-types";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const patch = await req.json() as Partial<Comanda>;
  // Recalcula total a partir dos itens SÓ se um total explícito não veio no corpo
  // (a finalização pode enviar um total ajustado manualmente).
  if (patch.itens && patch.total === undefined) patch.total = calcularTotalItens(patch.itens);
  await atualizarComanda(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const comanda = await getComanda(id);
  if (!comanda) return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  await excluirComanda(id);
  return NextResponse.json({ ok: true });
}
