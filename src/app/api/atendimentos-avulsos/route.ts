import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getAdminDb } from "@/lib/firebase-admin";
import { criarAtendimentoAvulso, listarTodosAtendimentosAvulsos } from "@/lib/atendimentos-avulsos";
import { criarMovimentacao } from "@/lib/estoque-movimentacoes";
import type { ItemAtendimento } from "@/lib/agendamentos-types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const avulsos = await listarTodosAtendimentosAvulsos();
  return NextResponse.json(avulsos);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    data: string;
    clienteNome: string;
    clienteTelefone?: string;
    agendamentoId?: string;
    itens: ItemAtendimento[];
  };

  const { data, clienteNome, clienteTelefone, agendamentoId, itens } = body;
  if (!data || !clienteNome?.trim() || !itens?.length) {
    return NextResponse.json({ error: "data, clienteNome e itens são obrigatórios" }, { status: 400 });
  }

  const total = itens.reduce((s, i) => s + Number(i.valor), 0);
  const id = await criarAtendimentoAvulso({
    data,
    clienteNome: clienteNome.trim(),
    clienteTelefone: clienteTelefone?.trim() || undefined,
    agendamentoId: agendamentoId || undefined,
    itens,
    total,
  });

  // Registra movimentação e desconta estoque para cada produto vendido
  const db = getAdminDb();
  const itensProduto = itens.filter((i) => i.tipo === "produto" && i.produtoId);
  await Promise.all(itensProduto.map(async (item) => {
    const produtoId = item.produtoId!;
    try {
      // Busca nome e imagem atualizados do produto
      const prodDoc = await db.collection("produtos").doc(produtoId).get();
      const prodData = prodDoc.data() ?? {};
      const produtoNome = prodData.titulo ?? item.descricao;
      const produtoImagem = prodData.imagem as string | undefined;

      // Registra movimentação de saída
      await criarMovimentacao({
        produtoId,
        produtoNome,
        produtoImagem,
        tipo: "venda",
        quantidade: -1,
        obs: `Atendimento — ${clienteNome.trim()}`,
      });

      // Desconta do estoque (evita ir abaixo de 0)
      const estoqueAtual = typeof prodData.estoque === "number" ? prodData.estoque : 0;
      if (estoqueAtual > 0) {
        await db.collection("produtos").doc(produtoId).update({
          estoque: estoqueAtual - 1,
          updatedAt: Date.now(),
        });
      }
    } catch {
      // Não bloqueia o atendimento se falhar
    }
  }));

  return NextResponse.json({ id });
}
