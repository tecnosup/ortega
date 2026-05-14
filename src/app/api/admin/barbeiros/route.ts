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
  const apelido = body.apelido ? String(body.apelido).trim().slice(0, 40) : undefined;
  const foto = body.foto ? String(body.foto).trim() : undefined;
  const comissao = Math.min(100, Math.max(0, Number(body.comissao) || 0));
  const ativo = body.ativo !== false;

  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const tipo = ["barbeiro", "faxineira", "secretaria"].includes(body.tipo) ? body.tipo : "barbeiro";
  const comissoesServico = Array.isArray(body.comissoesServico) ? body.comissoesServico : [];

  const id = await createBarbeiro({ nome, apelido, foto, comissao, ativo, tipo, comissoesServico });
  return NextResponse.json({ id }, { status: 201 });
}
