import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getAdminDb } from "@/lib/firebase-admin";
import { hojeBR } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function calcNextVencimento(current: string, frequencia: string): string | null {
  const d = new Date(current + "T12:00:00");
  switch (frequencia) {
    case "mensal":    d.setMonth(d.getMonth() + 1); break;
    case "quinzenal": d.setDate(d.getDate() + 15); break;
    case "semanal":   d.setDate(d.getDate() + 7); break;
    case "anual":     d.setFullYear(d.getFullYear() + 1); break;
    case "unico":     return null;
    default:          return null;
  }
  return d.toISOString().split("T")[0];
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user?.admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const { valorPago, dataPagamento } = await req.json() as { valorPago?: number; dataPagamento?: string };

  const db = getAdminDb();
  const doc = await db.collection("gastos").doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const gasto = doc.data()!;
  const hoje = hojeBR();
  const pagamento = {
    valor: valorPago ?? gasto.valor,
    data: dataPagamento ?? hoje,
    registradoEm: Date.now(),
  };

  // Registra o pagamento como GASTO DO DIA — assim o recorrente pago entra no
  // caixa/fechamento e em "Últimos gastos", igual a um avulso (dinheiro real que saiu).
  let catNome = "", catCor = "";
  if (gasto.categoriaId) {
    const catDoc = await db.collection("categorias_gasto").doc(gasto.categoriaId).get();
    if (catDoc.exists) { const c = catDoc.data()!; catNome = c.nome ?? ""; catCor = c.cor ?? ""; }
  }
  await db.collection("gastos_dia").add({
    data: pagamento.data,
    descricao: gasto.descricao,
    valor: pagamento.valor,
    criadoEm: Date.now(),
    origemGastoId: id,
    ...(gasto.categoriaId ? { categoriaId: gasto.categoriaId, categoriaNome: catNome, categoriaCor: catCor } : {}),
  });

  const nextVenc = calcNextVencimento(gasto.proximoVencimento ?? hoje, gasto.frequencia ?? "mensal");
  const patch: Record<string, unknown> = {
    atualizadoEm: Date.now(),
    pagamentos: [...(gasto.pagamentos ?? []), pagamento],
  };
  if (nextVenc) {
    patch.proximoVencimento = nextVenc;
  } else {
    patch.proximoVencimento = null;
    patch.lembrarRenovacao = false;
  }

  await db.collection("gastos").doc(id).update(patch);
  return NextResponse.json({ ok: true, proximoVencimento: nextVenc });
}
