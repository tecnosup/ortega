import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// GET /api/slots?data=YYYY-MM-DD → lista horários bloqueados pelo admin naquele dia
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });

  const db = getAdminDb();
  const snap = await db.collection("slots_bloqueados").where("data", "==", data).get();
  const bloqueados = snap.docs.map((d) => d.data().horario as string);
  return NextResponse.json({ bloqueados });
}

// POST /api/slots { data, horario, acao: "bloquear" | "desbloquear" }
export async function POST(req: NextRequest) {
  const { data, horario, acao } = await req.json() as {
    data: string;
    horario: string;
    acao: "bloquear" | "desbloquear";
  };
  if (!data || !horario || !acao) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const db = getAdminDb();
  const col = db.collection("slots_bloqueados");

  if (acao === "bloquear") {
    const exists = await col.where("data", "==", data).where("horario", "==", horario).get();
    if (exists.empty) await col.add({ data, horario });
  } else {
    const snap = await col.where("data", "==", data).where("horario", "==", horario).get();
    for (const doc of snap.docs) await doc.ref.delete();
  }

  return NextResponse.json({ ok: true });
}
