import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getLandingSettings } from "@/lib/admin-settings";

export const dynamic = "force-dynamic";

/**
 * Auto-confirmação de agendamentos no modo "tempo".
 *
 * Disparado por um cron externo (cron-job.org) a cada ~5 min — ver SETUP.md.
 * Confirma automaticamente agendamentos que continuam "pendente" depois de
 * `autoConfirmMinutos` desde que o cliente agendou (criadoEm).
 *
 * Segurança: exige header `Authorization: Bearer <CRON_SECRET>`.
 * Fallback seguro: se CRON_SECRET não estiver configurado, o endpoint não faz
 * nada e responde 200 (não quebra o site enquanto o ambiente não está pronto).
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  // Fallback seguro: sem secret configurado, não roda (ambiente ainda não pronto).
  if (!secret) {
    return NextResponse.json({ ok: true, skipped: "CRON_SECRET não configurado" });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getLandingSettings();
  if (settings.autoConfirmMode !== "tempo") {
    return NextResponse.json({ ok: true, mode: settings.autoConfirmMode, confirmados: 0 });
  }

  const minutos = settings.autoConfirmMinutos > 0 ? settings.autoConfirmMinutos : 20;
  const corte = Date.now() - minutos * 60_000;

  const db = getAdminDb();
  // Busca só por status (índice simples, já existe) e filtra o tempo em memória —
  // evita depender de índice composto no Firestore. Volume de pendentes é pequeno.
  const snap = await db
    .collection("agendamentos")
    .where("status", "==", "pendente")
    .get();

  const vencidos = snap.docs.filter((d) => {
    const criadoEm = d.data().criadoEm as number | undefined;
    return typeof criadoEm === "number" && criadoEm <= corte;
  });

  if (vencidos.length === 0) {
    return NextResponse.json({ ok: true, confirmados: 0 });
  }

  const now = Date.now();
  const batch = db.batch();
  for (const doc of vencidos) {
    batch.update(doc.ref, {
      status: "confirmado",
      confirmadoAuto: true,
      avisoPendente: true,
      atualizadoEm: now,
    });
  }
  await batch.commit();

  return NextResponse.json({ ok: true, confirmados: vencidos.length });
}

// cron-job.org pode bater via GET ou POST — aceitamos os dois.
export const GET = handle;
export const POST = handle;
