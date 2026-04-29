import { NextRequest, NextResponse } from "next/server";
import { atualizarGasto, excluirGasto } from "@/lib/gastos";
import { getSessionUser } from "@/lib/firebase-admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await atualizarGasto(id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  await excluirGasto(id);
  return NextResponse.json({ ok: true });
}
