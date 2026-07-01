import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getMovimentacoes, criarMovimentacao } from "@/lib/estoque-movimentacoes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const movs = await getMovimentacoes();
  return NextResponse.json(movs);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { produtoId, produtoNome, produtoImagem, tipo, quantidade, obs } = body;

  if (!produtoId || !produtoNome || !tipo || quantidade === undefined) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const id = await criarMovimentacao({ produtoId, produtoNome, produtoImagem, tipo, quantidade, obs });
  return NextResponse.json({ ok: true, id });
}
