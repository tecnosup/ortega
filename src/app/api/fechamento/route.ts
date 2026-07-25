import { NextRequest, NextResponse } from "next/server";
import { fecharCaixaDia, listarFechamentos, listarAgendamentosPorData, getFechamentoPorData } from "@/lib/agendamentos";
import { listarAtendimentosAvulsosPorData } from "@/lib/atendimentos-avulsos";
import { listarComandasPorData } from "@/lib/comandas";
import { getSessionUser } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await req.json() as { data: string };
  if (!data) return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });

  // 1 query filtrada em vez de varrer a coleção de fechamentos.
  const jaFechado = await getFechamentoPorData(data);
  if (jaFechado) {
    return NextResponse.json({ error: "Caixa já fechado para este dia" }, { status: 409 });
  }

  const [doDia, avulsos, comandas] = await Promise.all([
    // só o dia que está sendo fechado (antes lia TODOS os agendamentos)
    listarAgendamentosPorData(data),
    listarAtendimentosAvulsosPorData(data),
    listarComandasPorData(data),
  ]);

  // Regra: não é possível fechar o caixa com comandas ainda em aberto.
  const abertas = comandas.filter((c) => c.status === "aberta");
  if (abertas.length > 0) {
    return NextResponse.json(
      { error: `Existem ${abertas.length} comanda(s) em aberto. Finalize ou cancele antes de fechar o caixa.` },
      { status: 422 }
    );
  }

  const finalizadas = comandas.filter((c) => c.status === "finalizada");
  const id = await fecharCaixaDia(data, doDia, avulsos, finalizadas);
  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fechamentos = await listarFechamentos();
  return NextResponse.json(fechamentos);
}
