import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getSessionUser } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// GET /api/slots?data=YYYY-MM-DD[&barbeiroId=xxx] → horários bloqueados + ocupados pelo barbeiro
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });
  const barbeiroId = req.nextUrl.searchParams.get("barbeiroId");

  const db = getAdminDb();

  // slots bloqueados globalmente pelo admin
  const bloqSnap = await db.collection("slots_bloqueados").where("data", "==", data).get();
  const bloqueados = bloqSnap.docs.map((d) => d.data().horario as string);

  // se barbeiro específico, inclui os horários já ocupados por ele
  if (barbeiroId) {
    const agSnap = await db
      .collection("agendamentos")
      .where("data", "==", data)
      .where("barbeiroId", "==", barbeiroId)
      .get();
    const ocupados = agSnap.docs
      .filter((d) => d.data().status !== "cancelado")
      .map((d) => d.data().horario as string);
    const todos = Array.from(new Set([...bloqueados, ...ocupados]));
    return NextResponse.json({ bloqueados: todos });
  }

  return NextResponse.json({ bloqueados });
}

// POST /api/slots { data, horario, acao: "bloquear" | "desbloquear" }
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
