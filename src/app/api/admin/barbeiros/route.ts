import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { listBarbeiros, createBarbeiro } from "@/lib/barbeiros";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const barbeiros = await listBarbeiros();
  return NextResponse.json({ barbeiros });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const nome = String(body.nome ?? "").trim().slice(0, 80);
  const comissao = Math.min(100, Math.max(0, Number(body.comissao) || 0));
  const ativo = body.ativo !== false;
  const tipo = ["barbeiro", "faxineira", "secretaria"].includes(body.tipo) ? body.tipo : "barbeiro";
  const comissoesServico = Array.isArray(body.comissoesServico) ? body.comissoesServico : [];

  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const payload: Record<string, unknown> = { nome, comissao, ativo, tipo, comissoesServico };
  if (body.apelido) payload.apelido = String(body.apelido).trim().slice(0, 40);
  if (body.foto) payload.foto = String(body.foto).trim();

  const id = await createBarbeiro(payload as Parameters<typeof createBarbeiro>[0]);
  return NextResponse.json({ id }, { status: 201 });
}
