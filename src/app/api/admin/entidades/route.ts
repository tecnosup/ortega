import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getItems } from "@/lib/admin-items";
import { getProdutos } from "@/lib/admin-produtos";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [itens, produtos] = await Promise.all([
    getItems().catch(() => []),
    getProdutos().catch(() => []),
  ]);

  return NextResponse.json({
    itens: itens.map((i) => ({ id: i.id, titulo: i.titulo })),
    produtos: produtos.map((p) => ({ id: p.id, titulo: p.titulo })),
  });
}
