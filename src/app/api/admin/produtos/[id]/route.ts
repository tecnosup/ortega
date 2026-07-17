import { NextRequest, NextResponse } from "next/server";
import { getProdutoById, updateProduto } from "@/lib/admin-produtos";
import { adminAuth } from "@/lib/firebase-admin";
import { logAudit } from "@/lib/audit";
import { cookies } from "next/headers";

async function getActor(): Promise<{ uid: string; email: string | null } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("base_admin_session")?.value ?? "";
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getActor())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const produto = await getProdutoById(id);
  return NextResponse.json({ produto });
}

// PATCH /api/admin/produtos/[id] → edita produto (modal). NÃO mexe no `estoque`
// aqui — estoque é ajustado só via movimentação (−/+ do card), pra manter o
// histórico coerente. Campos aceitos: titulo, descricao, imagem, preco, status,
// categoriaId, estoqueMinimo.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const before = await getProdutoById(id);
  if (!before) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (body?.titulo !== undefined && !String(body.titulo).trim()) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.titulo !== undefined) patch.titulo = String(body.titulo).trim().slice(0, 100);
  if (body.descricao !== undefined) patch.descricao = String(body.descricao).trim();
  if (body.imagem !== undefined) patch.imagem = body.imagem ? String(body.imagem).trim() : "";
  if (body.preco !== undefined) patch.preco = String(body.preco).trim();
  if (body.status !== undefined) patch.status = body.status === "published" ? "published" : "draft";
  if (body.categoriaId !== undefined) patch.categoriaId = body.categoriaId ? String(body.categoriaId).trim() : null;
  if (body.estoqueMinimo !== undefined) patch.estoqueMinimo = Math.max(0, Math.round(Number(body.estoqueMinimo) || 0));

  await updateProduto(id, patch);
  await logAudit({ actorUid: actor.uid, actorEmail: actor.email, action: "produto.update", entity: "produto", entityId: id, summary: `Produto "${patch.titulo ?? before.titulo}" atualizado`, snapshot: patch, snapshotAntes: before }).catch(() => {});

  return NextResponse.json({ ok: true });
}
