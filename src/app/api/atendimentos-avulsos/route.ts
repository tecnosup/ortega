import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { criarAtendimentoAvulso, listarTodosAtendimentosAvulsos } from "@/lib/atendimentos-avulsos";
import type { ItemAtendimento } from "@/lib/agendamentos-types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const avulsos = await listarTodosAtendimentosAvulsos();
  return NextResponse.json(avulsos);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    data: string;
    clienteNome: string;
    clienteTelefone?: string;
    agendamentoId?: string;
    itens: ItemAtendimento[];
  };

  const { data, clienteNome, clienteTelefone, agendamentoId, itens } = body;
  if (!data || !clienteNome?.trim() || !itens?.length) {
    return NextResponse.json({ error: "data, clienteNome e itens são obrigatórios" }, { status: 400 });
  }

  const total = itens.reduce((s, i) => s + Number(i.valor), 0);
  const id = await criarAtendimentoAvulso({
    data,
    clienteNome: clienteNome.trim(),
    clienteTelefone: clienteTelefone?.trim() || undefined,
    agendamentoId: agendamentoId || undefined,
    itens,
    total,
  });
  return NextResponse.json({ id });
}
