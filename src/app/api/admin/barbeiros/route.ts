import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { listBarbeiros, createBarbeiro } from "@/lib/barbeiros";

export const dynamic = "force-dynamic";

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
  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const apelido = body.apelido ? String(body.apelido).trim().slice(0, 40) : undefined;
  const foto = body.foto ? String(body.foto).trim() : undefined;
  const email = body.email ? String(body.email).trim().slice(0, 120) : undefined;
  const telefone = body.telefone ? String(body.telefone).trim().slice(0, 20) : undefined;
  const cpf = body.cpf ? String(body.cpf).trim().slice(0, 14) : undefined;
  const dataNascimento = body.dataNascimento ? String(body.dataNascimento).trim() : undefined;
  const endereco = body.endereco ? String(body.endereco).trim().slice(0, 200) : undefined;
  const comissao = Math.min(100, Math.max(0, Number(body.comissao) || 0));
  const ativo = body.ativo !== false;
  const tipo = ["barbeiro", "faxineira", "secretaria"].includes(body.tipo) ? body.tipo : "barbeiro";
  const comissoesServico = Array.isArray(body.comissoesServico) ? body.comissoesServico : [];

  const id = await createBarbeiro({
    nome, apelido, foto, email, telefone, cpf, dataNascimento, endereco,
    comissao, ativo, tipo, comissoesServico,
  });
  return NextResponse.json({ id }, { status: 201 });
}