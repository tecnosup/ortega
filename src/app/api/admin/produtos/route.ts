import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getProdutos } from "@/lib/admin-produtos";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const produtos = await getProdutos();
  return NextResponse.json({ produtos });
}
