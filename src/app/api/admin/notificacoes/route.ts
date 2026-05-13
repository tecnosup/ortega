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
    const limite30d = new Date(); limite30d.setDate(limite30d.getDate() - 30);
    const limite30dStr = limite30d.toISOString().split("T")[0];

    // ── Agendamentos pendentes ──────────────────────────────────────────────────
    const agSnap = await db.collection("agendamentos").where("status", "==", "pendente").get();

    let pendentes = 0, hoje_count = 0;
    let urgencia: Urgencia = "normal";

    for (const doc of agSnap.docs) {
      const d = doc.data();
      pendentes++;
      if (d.data === hoje) hoje_count++;
      if (urgencia !== "critico" && d.data && d.horario) {
        const ts = new Date(`${d.data}T${d.horario}:00`).getTime();
        if (ts < agora) { urgencia = "critico"; continue; }
      }
      if (urgencia === "normal" && d.criadoEm && agora - d.criadoEm > DUAS_HORAS) {
        urgencia = "atencao";
      }
    }

    // ── Caixas retroativos abertos ─────────────────────────────────────────────
    const [fechSnap, concluidosSnap, avulsosSnap] = await Promise.all([
      db.collection("fechamentos").get(),
      db.collection("agendamentos").where("status", "==", "concluido").get(),
      db.collection("atendimentos_avulsos").get(),
    ]);

    const fechDatas = new Set(
      fechSnap.docs.map(d => d.data().data as string).filter(d => d >= limite30dStr && d < hoje)
    );
    const datasComAtividade = new Set<string>();
    concluidosSnap.docs.forEach(doc => {
      const d = doc.data().data as string;
      if (d >= limite30dStr && d < hoje) datasComAtividade.add(d);
    });
    avulsosSnap.docs.forEach(doc => {
      const d = doc.data().data as string;
      if (d >= limite30dStr && d < hoje) datasComAtividade.add(d);
    });

    const caixasAbertosLista = [...datasComAtividade]
      .filter(d => !fechDatas.has(d))
      .sort()
      .reverse();
    const caixasAbertos = caixasAbertosLista.length;

    // ── Vencimentos próximos ───────────────────────────────────────────────────
    const em10d = new Date(); em10d.setDate(em10d.getDate() + 10);
    const em10dStr = em10d.toISOString().split("T")[0];

    const gastosSnap = await db.collection("gastos").where("lembrarRenovacao", "==", true).get();
    let vencimentos = 0;
    const vencimentosLista: { id: string; descricao: string; data: string; dias: number; valor: number; frequencia: string }[] = [];
    for (const doc of gastosSnap.docs) {
      const g = doc.data();
      if (g.proximoVencimento && g.proximoVencimento >= hoje && g.proximoVencimento <= em10dStr) {
        vencimentos++;
        const dias = Math.ceil((new Date(g.proximoVencimento + "T12:00:00").getTime() - Date.now()) / 86400000);
        vencimentosLista.push({ id: doc.id, descricao: g.descricao, data: g.proximoVencimento, dias, valor: Number(g.valor) || 0, frequencia: g.frequencia ?? "mensal" });
      }
    }

    const financeiro = caixasAbertos + vencimentos;
    const urgenciaFinanceiro: Urgencia = caixasAbertos > 0 ? "critico" : vencimentos > 0 ? "atencao" : "normal";

    return NextResponse.json({
      pendentes, hoje: hoje_count, total: pendentes, urgencia,
      financeiro, caixasAbertos, caixasAbertosLista, vencimentos, vencimentosLista, urgenciaFinanceiro,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
