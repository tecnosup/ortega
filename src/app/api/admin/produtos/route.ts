import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getProdutos, createProduto } from "@/lib/admin-produtos";
import { criarMovimentacao } from "@/lib/estoque-movimentacoes";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const produtos = await getProdutos();
  return NextResponse.json({ produtos });
}

// POST /api/admin/produtos → cria produto (usado pelo modal de novo produto)
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const titulo = String(body?.titulo ?? "").trim().slice(0, 100);
  if (!titulo) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const estoque = Math.max(0, Math.round(Number(body.estoque) || 0));
  const dados = {
    titulo,
    descricao: String(body.descricao ?? "").trim(),
    imagem: body.imagem ? String(body.imagem).trim() : "",
    preco: String(body.preco ?? "").trim(),
    status: body.status === "published" ? "published" as const : "draft" as const,
    order: Number(body.order) || 0,
    categoriaId: body.categoriaId ? String(body.categoriaId).trim() : undefined,
    estoque,
    estoqueMinimo: Math.max(0, Math.round(Number(body.estoqueMinimo) || 5)),
  };

  const id = await createProduto(dados);
  // estoque inicial vira uma movimentação de reposição (rastreável no histórico)
  if (estoque > 0) {
    await criarMovimentacao({ produtoId: id, produtoNome: titulo, produtoImagem: dados.imagem || undefined, tipo: "reposicao", quantidade: estoque, obs: "Estoque inicial" }).catch(() => {});
  }
  await logAudit({ actorUid: user.uid, actorEmail: null, action: "produto.create", entity: "produto", entityId: id, summary: `Produto "${titulo}" criado`, snapshot: dados }).catch(() => {});

  return NextResponse.json({ id }, { status: 201 });
}
