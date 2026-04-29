import { NextRequest, NextResponse } from "next/server";
import { listarCupons, criarCupom, validarCupom } from "@/lib/cupons";
import { getSessionUser } from "@/lib/firebase-admin";

// GET /api/cupons?codigo=XXX  → validação pública de cupom
// GET /api/cupons             → listagem admin
export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get("codigo");

  if (codigo) {
    const resultado = await validarCupom(codigo);
    return NextResponse.json(resultado);
  }

  // listagem → requer admin
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const cupons = await listarCupons();
  return NextResponse.json(cupons);
}

// POST /api/cupons → criar cupom (admin)
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { codigo, descricao, tipo, valor, ativo, usoMaximo } = body;

  if (!codigo || !tipo || valor === undefined) {
    return NextResponse.json({ error: "Campos obrigatórios: codigo, tipo, valor" }, { status: 400 });
  }

  try {
    const id = await criarCupom({ codigo, descricao: descricao ?? "", tipo, valor: Number(valor), ativo: ativo ?? true, usoMaximo: usoMaximo ?? null });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao criar cupom";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
