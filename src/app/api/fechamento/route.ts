import { NextRequest, NextResponse } from "next/server";
import { fecharCaixaDia, listarFechamentos, listarAgendamentos } from "@/lib/agendamentos";
import { listarAtendimentosAvulsosPorData } from "@/lib/atendimentos-avulsos";
import { listarComandasPorData } from "@/lib/comandas";
import { getSessionUser } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await req.json() as { data: string };
  if (!data) return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });

  const fechamentos = await listarFechamentos();
  if (fechamentos.some((f) => f.data === data)) {
    return NextResponse.json({ error: "Caixa já fechado para este dia" }, { status: 409 });
  }

  const [todos, avulsos, comandas] = await Promise.all([
    listarAgendamentos(),
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
  const doDia = todos.filter((a) => a.data === data);
  const id = await fecharCaixaDia(data, doDia, avulsos, finalizadas);
  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fechamentos = await listarFechamentos();
  return NextResponse.json(fechamentos);
}
