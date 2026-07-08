import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { criarComanda, listarComandas, listarComandasPorData } from "@/lib/comandas";
import { calcularTotalItens, type ItemComanda } from "@/lib/comandas-types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = req.nextUrl.searchParams.get("data");
  const comandas = data ? await listarComandasPorData(data) : await listarComandas();
  return NextResponse.json(comandas);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    data: string;
    clienteNome: string;
    clienteTelefone?: string;
    itens: ItemComanda[];
    formaPagamento?: string;
    barbeiroId?: string;
    barbeiroNome?: string;
  };

  const { data, clienteNome, clienteTelefone, itens, formaPagamento, barbeiroId, barbeiroNome } = body;
  if (!data || !clienteNome?.trim() || !itens?.length) {
    return NextResponse.json({ error: "data, clienteNome e itens são obrigatórios" }, { status: 400 });
  }

  const id = await criarComanda({
    origem: "avulsa",
    clienteNome: clienteNome.trim(),
    clienteTelefone,
    data,
    itens,
    total: calcularTotalItens(itens),
    formaPagamento,
    barbeiroId,
    barbeiroNome,
  });
  return NextResponse.json({ id });
}
