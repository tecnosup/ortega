import { NextRequest, NextResponse } from "next/server";
import { demogetAgendamento, demoatualizarAgendamento, demoexcluirAgendamento } from "@/lib/demo-agendamentos";
import type { AgendamentoStatus } from "@/lib/agendamentos";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ag = demogetAgendamento(id);
  if (!ag) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(ag);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as { status: AgendamentoStatus };

  if (!["confirmado", "cancelado", "pendente", "concluido", "nao_compareceu"].includes(body.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const ag = demogetAgendamento(id);
  if (!ag) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  demoatualizarAgendamento(id, { status: body.status });

  let whatsappLink: string | null = null;
  const dataFormatada = new Date(ag.data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  if (body.status === "confirmado") {
    const msg = encodeURIComponent(
      `Olá ${ag.nome}! 👋\n\nSeu agendamento na *Ortega Barber* foi *confirmado*! ✅\n\n` +
      `✂️ Serviço: ${ag.servico}\n📅 Data: ${dataFormatada}\n🕐 Horário: ${ag.horario}\n\n` +
      `Te esperamos! Qualquer dúvida é só chamar.`
    );
    whatsappLink = `https://wa.me/55${ag.telefone.replace(/\D/g, "")}?text=${msg}`;
  }

  if (body.status === "cancelado") {
    const msg = encodeURIComponent(
      `Olá ${ag.nome}, tudo bem?\n\nInfelizmente precisamos *cancelar* seu agendamento na Ortega Barber.\n\n` +
      `✂️ Serviço: ${ag.servico}\n📅 Data: ${dataFormatada}\n🕐 Horário: ${ag.horario}\n\n` +
      `Pedimos desculpas pelo inconveniente. Entre em contato para reagendar! 😊`
    );
    whatsappLink = `https://wa.me/55${ag.telefone.replace(/\D/g, "")}?text=${msg}`;
  }

  return NextResponse.json({ ok: true, whatsappLink });
}

// editar serviço, preço e/ou reagendar (data + horario)
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as { servico?: string; preco?: string; data?: string; horario?: string };

  const ag = demogetAgendamento(id);
  if (!ag) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const patch: Record<string, string> = {};
  if (body.servico !== undefined) patch.servico = body.servico;
  if (body.preco !== undefined) patch.preco = body.preco;
  if (body.data !== undefined) patch.data = body.data;
  if (body.horario !== undefined) patch.horario = body.horario;

  demoatualizarAgendamento(id, patch);

  // Se houve reagendamento, notifica o cliente via WhatsApp
  const reagendou = body.data !== undefined || body.horario !== undefined;
  let whatsappLink: string | null = null;

  if (reagendou) {
    const novaData = body.data ?? ag.data;
    const novoHorario = body.horario ?? ag.horario;
    const dataFormatada = new Date(novaData + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long",
    });
    const msg = encodeURIComponent(
      `Olá ${ag.nome}! 👋\n\nSeu agendamento na *Ortega Barber* foi *alterado* pelo nosso time. 📅\n\n` +
      `✂️ Serviço: ${body.servico ?? ag.servico}\n` +
      `📅 Nova data: ${dataFormatada}\n` +
      `🕐 Novo horário: ${novoHorario}\n\n` +
      `Qualquer dúvida é só chamar. Te esperamos! 😊`
    );
    whatsappLink = `https://wa.me/55${ag.telefone.replace(/\D/g, "")}?text=${msg}`;
  }

  return NextResponse.json({ ok: true, whatsappLink });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = demoexcluirAgendamento(id);
  if (!ok) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
