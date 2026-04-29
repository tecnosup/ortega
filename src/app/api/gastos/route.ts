import { NextRequest, NextResponse } from "next/server";
import { listarGastos, criarGasto } from "@/lib/gastos";
import { getSessionUser } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return NextResponse.json(await listarGastos());
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { descricao, categoria, valor, frequencia, ativo, vencimento } = body;
  if (!descricao || !categoria || valor === undefined || !frequencia) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }
  const id = await criarGasto({ descricao, categoria, valor: Number(valor), frequencia, ativo: ativo ?? true, vencimento: vencimento ?? null });
  return NextResponse.json({ id }, { status: 201 });
}
