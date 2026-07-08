import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getSessionUser } from "@/lib/firebase-admin";
import { slotsOcupadosPorAgendamento, normalizarPasso } from "@/lib/grade";

export const dynamic = "force-dynamic";

// lê o passo global da grade (settings/grade)
async function getPasso(db: FirebaseFirestore.Firestore): Promise<number> {
  const doc = await db.collection("settings").doc("grade").get();
  return normalizarPasso(doc.exists ? doc.data()?.passoMin : undefined);
}

// expande cada agendamento para todos os slots que sua duração ocupa
function expandirOcupados(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  passo: number
): string[] {
  const out: string[] = [];
  for (const d of docs) {
    const a = d.data();
    if (a.status === "cancelado") continue;
    out.push(...slotsOcupadosPorAgendamento(a.horario as string, a.duracaoMin as number | undefined, passo));
  }
  return out;
}

// GET /api/slots?data=YYYY-MM-DD[&barbeiroId=xxx] → horários bloqueados + ocupados (intervalo cheio)
export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  if (!data) return NextResponse.json({ error: "data obrigatória" }, { status: 400 });
  const barbeiroId = req.nextUrl.searchParams.get("barbeiroId");

  const db = getAdminDb();
  const passo = await getPasso(db);

  // slots bloqueados globalmente pelo admin
  const bloqSnap = await db.collection("slots_bloqueados").where("data", "==", data).get();
  const bloqueados = bloqSnap.docs.map((d) => d.data().horario as string);

  // se barbeiro específico, inclui os slots ocupados por ele (intervalo cheio da duração)
  if (barbeiroId) {
    const agSnap = await db
      .collection("agendamentos")
      .where("data", "==", data)
      .where("barbeiroId", "==", barbeiroId)
      .get();
    const ocupados = expandirOcupados(agSnap.docs, passo);
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
