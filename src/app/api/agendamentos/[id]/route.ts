import { NextRequest, NextResponse } from "next/server";
import { getAgendamento, atualizarAgendamento, excluirAgendamento } from "@/lib/agendamentos";
import type { AgendamentoStatus } from "@/lib/agendamentos";
import { getSessionUser, getAdminDb } from "@/lib/firebase-admin";
import { devolverCredito } from "@/lib/assinaturas";
import { getComandaPorAgendamento, finalizarComanda, cancelarComanda, atualizarComanda, excluirComanda } from "@/lib/comandas";
import { parsePriceNum } from "@/lib/agendamentos-types";

async function appendLog(id: string, acao: string, adminId: string) {
  const db = getAdminDb();
  const entry = { acao, adminId, ts: Date.now() };
  const doc = db.collection("agendamentos").doc(id);
  const snap = await doc.get();
  const historico: unknown[] = snap.data()?.historico ?? [];
  await doc.update({ historico: [...historico, entry] });
}

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ag = await getAgendamento(id);
  if (!ag) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(ag);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as { status: AgendamentoStatus };

  const VALID_STATUS = ["confirmado", "cancelado", "pendente", "concluido", "nao_compareceu"];
  if (!VALID_STATUS.includes(body.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const ag = await getAgendamento(id);
  if (!ag) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await atualizarAgendamento(id, { status: body.status });
  appendLog(id, `status → ${body.status}`, user.uid).catch(() => {});

  // Mantém a COMANDA vinculada em sincronia com o status do agendamento.
  // (cancelar/finalizar só agem se a comanda estiver "aberta" — guarda interna)
  if (body.status === "cancelado" || body.status === "concluido" || body.status === "nao_compareceu") {
    getComandaPorAgendamento(id)
      .then((comanda) => {
        if (!comanda || comanda.status !== "aberta") return;
        // concluído → finaliza (entra no faturamento); cancelado/não-compareceu → cancela
        return body.status === "concluido"
          ? finalizarComanda(comanda.id)
          : cancelarComanda(comanda.id);
      })
      .catch(() => {});
  }

  // Reembolso de crédito quando barbeiro/admin cancela agendamento coberto por assinatura
  if (body.status === "cancelado" && ag.cobertoPorAssinatura && ag.assinaturaId) {
    devolverCredito(ag.assinaturaId).catch(() => {});
  }

  let whatsappLink: string | null = null;
  const dataFormatada = new Date(ag.data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  if (body.status === "confirmado") {
    const msg = encodeURIComponent(
      `Olá ${ag.nome}! 👋\n\nSeu agendamento na *Ortega* foi *confirmado*! ✅\n\n` +
      `✂️ Serviço: ${ag.servico}\n📅 Data: ${dataFormatada}\n🕐 Horário: ${ag.horario}\n\n` +
      `Te esperamos! Qualquer dúvida é só chamar.`
    );
    whatsappLink = `https://wa.me/55${ag.telefone.replace(/\D/g, "")}?text=${msg}`;
  }

  if (body.status === "cancelado") {
    const msg = encodeURIComponent(
      `Olá ${ag.nome}, tudo bem?\n\nInfelizmente precisamos *cancelar* seu agendamento na Ortega.\n\n` +
      `✂️ Serviço: ${ag.servico}\n📅 Data: ${dataFormatada}\n🕐 Horário: ${ag.horario}\n\n` +
      `Pedimos desculpas pelo inconveniente. Entre em contato para reagendar! 😊`
    );
    whatsappLink = `https://wa.me/55${ag.telefone.replace(/\D/g, "")}?text=${msg}`;
  }

  return NextResponse.json({ ok: true, whatsappLink });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as { servico?: string; preco?: string; data?: string; horario?: string; barbeiroId?: string | null; barbeiroNome?: string | null };

  const ag = await getAgendamento(id);
  if (!ag) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (body.servico !== undefined) patch.servico = body.servico;
  if (body.preco !== undefined) patch.preco = body.preco;
  if (body.data !== undefined) patch.data = body.data;
  if (body.horario !== undefined) patch.horario = body.horario;
  if (body.barbeiroId !== undefined) patch.barbeiroId = body.barbeiroId ?? null;
  if (body.barbeiroNome !== undefined) patch.barbeiroNome = body.barbeiroNome ?? null;

  await atualizarAgendamento(id, patch);
  const descricaoAcao = (body.data || body.horario)
    ? `reagendado → ${body.data ?? ag.data} ${body.horario ?? ag.horario}`
    : `editado serviço/preço`;
  appendLog(id, descricaoAcao, user.uid).catch(() => {});

  // Espelha a mudança na COMANDA vinculada (data/horário/barbeiro; e serviço/preço
  // recompõem o item e o total). Só toca no que veio no body.
  getComandaPorAgendamento(id)
    .then((comanda) => {
      if (!comanda) return;
      const cp: Record<string, unknown> = {};
      if (body.data !== undefined) cp.data = body.data;
      if (body.horario !== undefined) cp.horario = body.horario;
      if (body.barbeiroId !== undefined) cp.barbeiroId = body.barbeiroId ?? null;
      if (body.barbeiroNome !== undefined) cp.barbeiroNome = body.barbeiroNome ?? null;
      // serviço/preço: só recompõe se a comanda ainda reflete só o serviço do agendamento
      // (1 item de serviço) — não mexe em comandas que já ganharam produtos/itens extras
      if ((body.servico !== undefined || body.preco !== undefined) && comanda.itens?.length === 1 && comanda.itens[0]?.tipo === "servico") {
        const desc = body.servico ?? comanda.itens[0].descricao;
        const valor = body.preco !== undefined ? parsePriceNum(body.preco) : comanda.itens[0].valor;
        cp.itens = [{ ...comanda.itens[0], descricao: desc, valor }];
        cp.total = valor;
      }
      if (Object.keys(cp).length > 0) return atualizarComanda(comanda.id, cp);
    })
    .catch(() => {});

  const reagendou = body.data !== undefined || body.horario !== undefined;
  let whatsappLink: string | null = null;

  if (reagendou) {
    const novaData = body.data ?? ag.data;
    const novoHorario = body.horario ?? ag.horario;
    const dataFormatada = new Date(novaData + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long",
    });
    const msg = encodeURIComponent(
      `Olá ${ag.nome}! 👋\n\nSeu agendamento na *Ortega* foi *alterado* pelo nosso time. 📅\n\n` +
      `✂️ Serviço: ${body.servico ?? ag.servico}\n` +
      `📅 Nova data: ${dataFormatada}\n` +
      `🕐 Novo horário: ${novoHorario}\n\n` +
      `Qualquer dúvida é só chamar. Te esperamos! 😊`
    );
    whatsappLink = `https://wa.me/55${ag.telefone.replace(/\D/g, "")}?text=${msg}`;
  }

  return NextResponse.json({ ok: true, whatsappLink });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ag = await getAgendamento(id);
  if (!ag) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  await excluirAgendamento(id);
  // remove a comanda vinculada pra não ficar órfã no Caixa
  getComandaPorAgendamento(id)
    .then((comanda) => { if (comanda) return excluirComanda(comanda.id); })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}
