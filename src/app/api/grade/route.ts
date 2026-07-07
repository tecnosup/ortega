import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getSessionUser } from "@/lib/firebase-admin";
import { GRADE_DEFAULT, mesclarGrade, type GradeConfig } from "@/lib/grade";

export const dynamic = "force-dynamic";

// GET /api/grade → configuração da grade (leitura pública, usada pelo site do cliente)
export async function GET() {
  const db = getAdminDb();
  const doc = await db.collection("settings").doc("grade").get();
  const grade = doc.exists
    ? mesclarGrade(doc.data() as Partial<Record<number, GradeConfig[number]>>)
    : GRADE_DEFAULT;
  return NextResponse.json({ grade });
}

// POST /api/grade { grade } → salva a configuração (somente admin)
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { grade?: GradeConfig };
  if (!body?.grade) return NextResponse.json({ error: "grade obrigatória" }, { status: 400 });

  // normaliza (garante os 7 dias e descarta campos extras)
  const limpa = mesclarGrade(body.grade);

  const db = getAdminDb();
  await db.collection("settings").doc("grade").set(limpa);
  return NextResponse.json({ ok: true });
}
