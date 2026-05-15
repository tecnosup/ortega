import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getBarbeiro, updateBarbeiro, deleteBarbeiro } from "@/lib/barbeiros";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const barbeiro = await getBarbeiro(id);
  if (!barbeiro) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ barbeiro });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = {};

  if (body.nome !== undefined) patch.nome = String(body.nome).trim().slice(0, 80);
  if (body.apelido !== undefined) patch.apelido = body.apelido ? String(body.apelido).trim().slice(0, 40) : null;
  if (body.foto !== undefined) patch.foto = body.foto ? String(body.foto).trim() : null;
  if (body.email !== undefined) patch.email = body.email ? String(body.email).trim().slice(0, 120) : null;
  if (body.telefone !== undefined) patch.telefone = body.telefone ? String(body.telefone).trim().slice(0, 20) : null;
  if (body.cpf !== undefined) patch.cpf = body.cpf ? String(body.cpf).trim().slice(0, 14) : null;
  if (body.dataNascimento !== undefined) patch.dataNascimento = body.dataNascimento ? String(body.dataNascimento).trim() : null;
  if (body.endereco !== undefined) patch.endereco = body.endereco ? String(body.endereco).trim().slice(0, 200) : null;
  if (body.comissao !== undefined) patch.comissao = Math.min(100, Math.max(0, Number(body.comissao) || 0));
  if (body.ativo !== undefined) patch.ativo = Boolean(body.ativo);
  if (body.presenteHoje !== undefined) patch.presenteHoje = Boolean(body.presenteHoje);
  if (body.tipo !== undefined) patch.tipo = body.tipo ? String(body.tipo).trim().slice(0, 60) : null;
  if (body.comissoesServico !== undefined) patch.comissoesServico = Array.isArray(body.comissoesServico) ? body.comissoesServico : [];

  await updateBarbeiro(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteBarbeiro(id);
  return NextResponse.json({ ok: true });
}
