import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function normalizeTelefone(t: string) {
  return t.replace(/\D/g, "");
}

export async function GET(req: NextRequest) {
  if (!rateLimit(`agendamento-status:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
  }

  const telefone = req.nextUrl.searchParams.get("telefone");
  if (!telefone || normalizeTelefone(telefone).length < 8)
    return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });

  const normalized = normalizeTelefone(telefone);

  const db = getAdminDb();
  // Fetch recent agendamentos and filter by phone in memory to avoid index requirements
  const snap = await db
    .collection("agendamentos")
    .orderBy("criadoEm", "desc")
    .limit(500)
    .get();

  const agendamentos = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as any))
    .filter((a) => normalizeTelefone(a.telefone ?? "") === normalized)
    .map((a) => ({
      id: a.id,
      servico: a.servico,
      data: a.data,
      horario: a.horario,
      status: a.status,
      preco: a.preco,
      cupom: a.cupom ?? null,
      desconto: a.desconto ?? null,
      criadoEm: a.criadoEm,
    }))
    .sort((a, b) => {
      if (a.data !== b.data) return b.data.localeCompare(a.data);
      return a.horario.localeCompare(b.horario);
    });

  return NextResponse.json({ agendamentos });
}
