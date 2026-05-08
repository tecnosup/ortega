import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

type Urgencia = "normal" | "atencao" | "critico";

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("base_admin_session")?.value;
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    await getAdminAuth().verifySessionCookie(session, true);

    const db = getAdminDb();
    const agora = Date.now();
    const hoje = new Date().toISOString().split("T")[0];
    const DUAS_HORAS = 2 * 60 * 60 * 1000;

    const snap = await db.collection("agendamentos").where("status", "==", "pendente").get();

    let pendentes = 0;
    let hoje_count = 0;
    let urgencia: Urgencia = "normal";

    for (const doc of snap.docs) {
      const d = doc.data();
      pendentes++;

      if (d.data === hoje) hoje_count++;

      // Horário do agendamento já passou sem confirmação → crítico
      if (urgencia !== "critico" && d.data && d.horario) {
        const agendamentoTs = new Date(`${d.data}T${d.horario}:00`).getTime();
        if (agendamentoTs < agora) {
          urgencia = "critico";
          continue;
        }
      }

      // Criado há mais de 2h sem confirmação → atenção
      if (urgencia === "normal" && d.criadoEm && agora - d.criadoEm > DUAS_HORAS) {
        urgencia = "atencao";
      }
    }

    return NextResponse.json({ pendentes, hoje: hoje_count, total: pendentes, urgencia });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
