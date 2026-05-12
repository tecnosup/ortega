import { NextRequest, NextResponse } from "next/server";
import { getBarbeiroSession, getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// GET /api/barbeiro/agendamentos?data=YYYY-MM-DD (opcional) — agendamentos do barbeiro logado
export async function GET(req: NextRequest) {
  const sessao = await getBarbeiroSession(req);
  if (!sessao) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { barbeiroId } = sessao;
  const data = req.nextUrl.searchParams.get("data");

  const db = getAdminDb();
  let query = db.collection("agendamentos").where("barbeiroId", "==", barbeiroId);
  if (data) query = query.where("data", "==", data) as typeof query;

  const snap = await query.orderBy("data").orderBy("horario").get();
  const agendamentos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(agendamentos);
}
