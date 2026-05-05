import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getDescontoById } from "@/lib/admin-descontos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const desconto = await getDescontoById(id);
  if (!desconto) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ desconto });
}
