import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getSessionUser } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// POST /api/slots/dia { data, horarios: string[], acao: "bloquear" | "desbloquear" }
// Bloqueia/desbloqueia vários horários de uma data de uma vez (fechar o dia).
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, horarios, acao } = (await req.json()) as {
    data: string;
    horarios: string[];
    acao: "bloquear" | "desbloquear";
  };
  if (!data || !Array.isArray(horarios) || !acao) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const db = getAdminDb();
  const col = db.collection("slots_bloqueados");
  const snap = await col.where("data", "==", data).get();
  const batch = db.batch();

  if (acao === "bloquear") {
    const jaBloq = new Set(snap.docs.map((d) => d.data().horario as string));
    for (const h of horarios) {
      if (!jaBloq.has(h)) batch.set(col.doc(), { data, horario: h });
    }
  } else {
    const alvo = new Set(horarios);
    for (const d of snap.docs) {
      if (alvo.has(d.data().horario as string)) batch.delete(d.ref);
    }
  }

  await batch.commit();
  return NextResponse.json({ ok: true });
}
