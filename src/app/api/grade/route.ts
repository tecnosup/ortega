import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getSessionUser } from "@/lib/firebase-admin";
import { GRADE_DEFAULT, mesclarGrade, normalizarPasso, type GradeConfig } from "@/lib/grade";

export const dynamic = "force-dynamic";

// GET /api/grade → configuração da grade + passo (leitura pública, usada pelo site do cliente)
export async function GET() {
  const db = getAdminDb();
  const doc = await db.collection("settings").doc("grade").get();
  const data = doc.exists ? doc.data() : null;
  const grade = data
    ? mesclarGrade(data as Partial<Record<number, GradeConfig[number]>>)
    : GRADE_DEFAULT;
  const passoMin = normalizarPasso(data?.passoMin);
  return NextResponse.json({ grade, passoMin });
}

// POST /api/grade { grade } → salva a configuração (somente admin)
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { grade?: GradeConfig; passoMin?: number };
  if (!body?.grade) return NextResponse.json({ error: "grade obrigatória" }, { status: 400 });

  // normaliza (garante os 7 dias e descarta campos extras) + guarda o passo global
  const limpa = mesclarGrade(body.grade);
  const passoMin = normalizarPasso(body.passoMin);

  const db = getAdminDb();
  await db.collection("settings").doc("grade").set({ ...limpa, passoMin });
  return NextResponse.json({ ok: true, passoMin });
}
