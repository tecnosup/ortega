import { NextRequest, NextResponse } from "next/server";
import { listarCategorias, criarCategoria } from "@/lib/gastos-categorias";
import { getSessionUser, getAdminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return NextResponse.json(await listarCategorias());
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { nome, cor, ordem } = body as { nome?: string; cor?: string; ordem?: number };
  if (!nome || !cor) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  let ordemFinal = ordem;
  if (ordemFinal === undefined) {
    const db = getAdminDb();
    const snap = await db.collection("categorias_gasto").count().get();
    ordemFinal = snap.data().count;
  }

  const id = await criarCategoria({ nome, cor, ordem: ordemFinal });
  return NextResponse.json({ id }, { status: 201 });
}
