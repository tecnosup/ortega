import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { movimentarEstoque } from "@/lib/estoque-movimentacoes";
import type { TipoMovimentacao } from "@/lib/estoque-movimentacoes-tipos";

export const dynamic = "force-dynamic";

const TIPOS_VALIDOS: TipoMovimentacao[] = ["venda", "reposicao", "devolucao", "ajuste_manual"];

// POST /api/admin/estoque-movimentacoes/ajuste
// Movimenta o estoque de UM produto (usado pelos botões −/+ do card) e registra
// a movimentação, tudo atômico. Body: { produtoId, produtoNome, produtoImagem?, tipo, quantidade (com sinal), obs? }
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.produtoId || !body?.tipo || typeof body.quantidade !== "number" || body.quantidade === 0) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }
  if (!TIPOS_VALIDOS.includes(body.tipo)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  try {
    const novoEstoque = await movimentarEstoque({
      produtoId: String(body.produtoId),
      produtoNome: String(body.produtoNome ?? ""),
      produtoImagem: body.produtoImagem ? String(body.produtoImagem) : undefined,
      tipo: body.tipo,
      quantidade: Math.round(body.quantidade),
      obs: body.obs ? String(body.obs).slice(0, 200) : undefined,
    });
    return NextResponse.json({ ok: true, estoque: novoEstoque });
  } catch (e) {
    // estoque insuficiente / produto não encontrado → 409
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao movimentar estoque" }, { status: 409 });
  }
}
