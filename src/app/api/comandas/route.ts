import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { criarComanda, listarComandas, listarComandasPorData } from "@/lib/comandas";
import { calcularTotalItens, type ItemComanda } from "@/lib/comandas-types";
import { diasAtras } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

// Janela padrão do GET sem ?data= — ver comentário no GET.
const JANELA_PADRAO_DIAS = 90;

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = req.nextUrl.searchParams;
  const data = params.get("data");
  if (data) return NextResponse.json(await listarComandasPorData(data));

  // Sem ?data= o Caixa pede uma janela. Default = 90d (o calendário navega
  // alguns meses); antes lia a coleção INTEIRA, que é a que mais cresce.
  const de = params.get("de") ?? diasAtras(JANELA_PADRAO_DIAS);
  const ate = params.get("ate") ?? undefined;
  const comandas = await listarComandas({ de, ...(ate ? { ate } : {}) });
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
    total?: number;
    formaPagamento?: string;
    barbeiroId?: string;
    barbeiroNome?: string;
  };

  const { data, clienteNome, clienteTelefone, itens, total, formaPagamento, barbeiroId, barbeiroNome } = body;
  if (!data || !clienteNome?.trim() || !itens?.length) {
    return NextResponse.json({ error: "data, clienteNome e itens são obrigatórios" }, { status: 400 });
  }

  const id = await criarComanda({
    origem: "avulsa",
    clienteNome: clienteNome.trim(),
    clienteTelefone,
    data,
    itens,
    // Usa o total ajustado manualmente se veio no corpo; senão, soma dos itens.
    total: typeof total === "number" ? total : calcularTotalItens(itens),
    formaPagamento,
    barbeiroId,
    barbeiroNome,
  });
  return NextResponse.json({ id });
}
