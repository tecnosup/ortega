import { NextRequest, NextResponse } from "next/server";
import { criarGastoDia, listarGastosDia } from "@/lib/gastos-dia";
import { getSessionUser } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const gastos = await listarGastosDia();
  return NextResponse.json(gastos);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, descricao, valor, categoriaId, categoriaNome, categoriaCor } = await req.json();
  if (!data || !descricao || !valor || isNaN(Number(valor)) || Number(valor) <= 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const id = await criarGastoDia({
    data: String(data),
    descricao: String(descricao).slice(0, 200),
    valor: Number(valor),
    ...(categoriaId ? {
      categoriaId: String(categoriaId),
      categoriaNome: String(categoriaNome ?? "").slice(0, 60),
      categoriaCor: String(categoriaCor ?? ""),
    } : {}),
  });
  return NextResponse.json({ id });
}
