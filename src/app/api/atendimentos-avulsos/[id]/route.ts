import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { atualizarAtendimentoAvulso, excluirAtendimentoAvulso } from "@/lib/atendimentos-avulsos";
import type { ItemAtendimento } from "@/lib/agendamentos-types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json() as {
    clienteNome?: string;
    clienteTelefone?: string;
    itens?: ItemAtendimento[];
  };

  const patch: Record<string, unknown> = {};
  if (body.clienteNome) patch.clienteNome = body.clienteNome.trim();
  if (body.clienteTelefone !== undefined) patch.clienteTelefone = body.clienteTelefone?.trim() || null;
  if (body.itens) {
    patch.itens = body.itens;
    patch.total = body.itens.reduce((s, i) => s + Number(i.valor), 0);
  }

  await atualizarAtendimentoAvulso(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await excluirAtendimentoAvulso(id);
  return NextResponse.json({ ok: true });
}
