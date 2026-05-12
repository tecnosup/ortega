import { NextRequest, NextResponse } from "next/server";
import { getBarbeiroSession, getAdminDb } from "@/lib/firebase-admin";
import { parsePriceNum } from "@/lib/agendamentos-types";

export const dynamic = "force-dynamic";

// GET /api/barbeiro/financeiro?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const sessao = await getBarbeiroSession(req);
  if (!sessao) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { barbeiroId } = sessao;
  const inicio = req.nextUrl.searchParams.get("inicio");
  const fim = req.nextUrl.searchParams.get("fim");

  const db = getAdminDb();

  const [barDoc, agSnap] = await Promise.all([
    db.collection("barbeiros").doc(barbeiroId).get(),
    db
      .collection("agendamentos")
      .where("barbeiroId", "==", barbeiroId)
      .where("status", "==", "concluido")
      .get(),
  ]);

  const comissao: number = barDoc.exists ? (barDoc.data()!.comissao ?? 0) : 0;

  const agendamentos = agSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as { id: string; data: string; preco: string; servico: string; cliente: string }))
    .filter((a) => {
      if (inicio && a.data < inicio) return false;
      if (fim && a.data > fim) return false;
      return true;
    });

  const totalBruto = agendamentos.reduce((s, a) => s + parsePriceNum(a.preco), 0);
  const totalComissao = totalBruto * (comissao / 100);

  return NextResponse.json({
    comissao,
    atendimentos: agendamentos.length,
    totalBruto,
    totalComissao,
    agendamentos,
  });
}
