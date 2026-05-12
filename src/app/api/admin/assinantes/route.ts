import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { listarAssinaturas } from "@/lib/assinaturas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const assinaturas = await listarAssinaturas();
  return NextResponse.json({ assinaturas });
}
