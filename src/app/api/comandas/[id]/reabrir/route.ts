import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { reabrirComanda, getComanda } from "@/lib/comandas";
import { getFechamentoPorData } from "@/lib/agendamentos";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const comanda = await getComanda(id);
  if (!comanda) return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  if (comanda.status !== "finalizada") {
    return NextResponse.json({ error: `Comanda está ${comanda.status}, não pode reabrir` }, { status: 422 });
  }

  // Só permite reabrir comanda enquanto o caixa do dia NÃO estiver fechado.
  // 1 query filtrada em vez de ler todos os fechamentos pra checar 1 dia.
  const fechamentoDoDia = await getFechamentoPorData(comanda.data);
  if (fechamentoDoDia) {
    return NextResponse.json(
      { error: "O caixa deste dia está fechado. Reabra o caixa antes de reabrir a comanda." },
      { status: 422 }
    );
  }

  const reaberta = await reabrirComanda(id);
  return NextResponse.json({ ok: true, comanda: reaberta });
}
