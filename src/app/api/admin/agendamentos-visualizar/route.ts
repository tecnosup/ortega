import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// Marca todos os agendamentos não visualizados como visualizados
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminDb();
  const snap = await db.collection("agendamentos").where("visualizadoAdmin", "==", false).get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, { visualizadoAdmin: true }));
  if (!snap.empty) await batch.commit();

  return NextResponse.json({ ok: true, marcados: snap.size });
}
