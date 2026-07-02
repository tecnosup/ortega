import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { sendPushToAll } from "@/lib/web-push";
import { pushVencimentoProximo } from "@/lib/push-messages";

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
    const agSnap = await db.collection("agendamentos").where("status", "==", "pendente").limit(500).get();

    let pendentes = 0, hoje_count = 0;
    let urgencia: Urgencia = "normal";
    const pendentesLista: { id: string; nome: string; servico: string; data: string; horario: string; atrasado: boolean }[] = [];

    for (const doc of agSnap.docs) {
      const d = doc.data();
      pendentes++;
      if (d.data === hoje) hoje_count++;
      let atrasado = false;
      if (d.data && d.horario) {
        const ts = new Date(`${d.data}T${d.horario}:00`).getTime();
        if (ts < agora) { atrasado = true; urgencia = "critico"; }
      }
      if (!atrasado && urgencia === "normal" && d.criadoEm && agora - d.criadoEm > DUAS_HORAS) {
        urgencia = "atencao";
      }
      pendentesLista.push({ id: doc.id, nome: d.nome as string, servico: d.servico as string, data: d.data as string, horario: d.horario as string, atrasado });
    }
    pendentesLista.sort((a, b) => a.data === b.data ? a.horario.localeCompare(b.horario) : a.data.localeCompare(b.data));

    // ── Agendamentos de hoje (confirmados/pendentes) para lembrete client-side ──
    const agendamentosHojeSnap = await db.collection("agendamentos")
      .where("data", "==", hoje)
      .where("status", "in", ["pendente", "confirmado"])
      .limit(100)
      .get();
    const agendamentosHoje = agendamentosHojeSnap.docs.map((doc) => {
      const d = doc.data();
      return { id: doc.id, nome: d.nome as string, servico: d.servico as string, data: d.data as string, horario: d.horario as string };
    });

    // ── Caixas retroativos abertos (apenas últimos 30 dias) ───────────────────
    const [fechSnap, concluidosSnap, avulsosSnap] = await Promise.all([
      db.collection("fechamentos").where("data", ">=", limite30dStr).where("data", "<", hoje).get(),
      db.collection("agendamentos").where("data", ">=", limite30dStr).where("data", "<", hoje).get(),
      db.collection("atendimentos_avulsos").where("data", ">=", limite30dStr).where("data", "<", hoje).get(),
    ]);

    const fechDatas = new Set(fechSnap.docs.map(d => d.data().data as string));
    const datasComAtividade = new Set<string>();
    concluidosSnap.docs.forEach(doc => {
      const d = doc.data();
      if (d.status === "concluido") datasComAtividade.add(d.data as string);
    });
    avulsosSnap.docs.forEach(doc => {
      datasComAtividade.add(doc.data().data as string);
    });

    const caixasAbertosLista = [...datasComAtividade]
      .filter(d => !fechDatas.has(d))
      .sort()
      .reverse();
    const caixasAbertos = caixasAbertosLista.length;

    // ── Vencimentos próximos ───────────────────────────────────────────────────
    const em10d = new Date(); em10d.setDate(em10d.getDate() + 10);
    const em10dStr = em10d.toISOString().split("T")[0];

    const gastosSnap = await db.collection("gastos").where("lembrarRenovacao", "==", true).limit(200).get();
    let vencimentos = 0;
    const vencimentosLista: { id: string; descricao: string; data: string; dias: number; valor: number; frequencia: string }[] = [];
    const AVISO_PUSH_DIAS = 3;
    const UM_DIA_MS = 24 * 60 * 60 * 1000;
    const avisosPendentes: { title: string; body: string; docRef: FirebaseFirestore.DocumentReference }[] = [];
    for (const doc of gastosSnap.docs) {
      const g = doc.data();
      if (g.proximoVencimento && g.proximoVencimento >= hoje && g.proximoVencimento <= em10dStr) {
        vencimentos++;
        const dias = Math.ceil((new Date(g.proximoVencimento + "T12:00:00").getTime() - Date.now()) / 86400000);
        vencimentosLista.push({ id: doc.id, descricao: g.descricao, data: g.proximoVencimento, dias, valor: Number(g.valor) || 0, frequencia: g.frequencia ?? "mensal" });

        // dispara push uma única vez por vencimento ao entrar na janela de aviso
        if (dias <= AVISO_PUSH_DIAS && (agora - (g.ultimoAvisoPushEm ?? 0)) > UM_DIA_MS) {
          const { title, body: pushBody } = pushVencimentoProximo(g.descricao, dias, Number(g.valor) || 0);
          avisosPendentes.push({ title, body: pushBody, docRef: doc.ref });
        }
      }
    }

    if (avisosPendentes.length > 0) {
      after(async () => {
        for (const aviso of avisosPendentes) {
          await sendPushToAll(aviso.title, aviso.body, "/admin/financeiro").catch(() => {});
          await aviso.docRef.update({ ultimoAvisoPushEm: agora }).catch(() => {});
        }
      });
    }

    const financeiro = caixasAbertos + vencimentos;
    const urgenciaFinanceiro: Urgencia = caixasAbertos > 0 ? "critico" : vencimentos > 0 ? "atencao" : "normal";

    return NextResponse.json({
      pendentes, hoje: hoje_count, total: pendentes, urgencia, agendamentosHoje, pendentesLista,
      financeiro, caixasAbertos, caixasAbertosLista, vencimentos, vencimentosLista, urgenciaFinanceiro,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
