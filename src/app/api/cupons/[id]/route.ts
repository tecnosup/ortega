import { NextRequest, NextResponse } from "next/server";
import { getCupom, atualizarCupom, excluirCupom } from "@/lib/cupons";
import { getSessionUser } from "@/lib/firebase-admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const cupom = await getCupom(id);
  if (!cupom) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(cupom);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await atualizarCupom(id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await excluirCupom(id);
  return NextResponse.json({ ok: true });
}
