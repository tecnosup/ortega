import { NextRequest, NextResponse } from "next/server";
import { getAgendamento, atualizarAgendamento } from "@/lib/agendamentos";
import { getSessionUser } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Gera o link de WhatsApp de confirmação para um agendamento auto-confirmado
 * e limpa o sinal `avisoPendente`. Usado pelo botão "Avisar cliente" no painel.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ag = await getAgendamento(id);
  if (!ag) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await atualizarAgendamento(id, { avisoPendente: false });

  const dataFormatada = new Date(ag.data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });
  const msg = encodeURIComponent(
    `Olá ${ag.nome}! 👋\n\nSeu agendamento na *Ortega Barber* foi *confirmado*! ✅\n\n` +
    `✂️ Serviço: ${ag.servico}\n📅 Data: ${dataFormatada}\n🕐 Horário: ${ag.horario}\n\n` +
    `Te esperamos! Qualquer dúvida é só chamar.`
  );
  const whatsappLink = `https://wa.me/55${ag.telefone.replace(/\D/g, "")}?text=${msg}`;

  return NextResponse.json({ ok: true, whatsappLink });
}
