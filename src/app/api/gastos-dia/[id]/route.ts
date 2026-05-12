import { NextRequest, NextResponse } from "next/server";
import { excluirGastoDia } from "@/lib/gastos-dia";
import { getSessionUser } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await excluirGastoDia(id);
  return NextResponse.json({ ok: true });
}
