import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { criarAgendamento, listarAgendamentos } from "@/lib/agendamentos";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPushToAll, sendPushToBarbeiro } from "@/lib/web-push";
import { pushNovoAgendamento } from "@/lib/push-messages";
import { getAssinaturaPorTelefone, getAssinaturaPorEmail, consumirCredito } from "@/lib/assinaturas";
import { getLandingSettings } from "@/lib/admin-settings";
import { criarComanda } from "@/lib/comandas";
import { parsePriceNum } from "@/lib/agendamentos-types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`agendamento:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
  }

  const body = await req.json();
  const { nome, telefone, servico, preco, data, horario, cupom, desconto, barbeiroId, barbeiroNome, email, assinaturaId: assinaturaIdExplicito, cobertoPorAssinatura: cobertoPorAssinaturaExplicito } = body;

  if (!nome || !telefone || !servico || !data || !horario) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const nomeSanitizado = String(nome).slice(0, 100);
  const telefoneSanitizado = String(telefone).replace(/\D/g, "").slice(0, 15);
  const servicoSanitizado = String(servico).slice(0, 100);

  if (telefoneSanitizado.length < 10) {
    return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
  }

  const payload: Parameters<typeof criarAgendamento>[0] = {
    nome: nomeSanitizado, telefone: telefoneSanitizado, servico: servicoSanitizado, preco: preco ?? "", data, horario,
  };
  if (cupom) payload.cupom = cupom;
  if (desconto !== undefined && desconto !== null) payload.desconto = desconto;
  if (barbeiroId) payload.barbeiroId = String(barbeiroId).slice(0, 64);
  if (barbeiroNome) payload.barbeiroNome = String(barbeiroNome).slice(0, 80);

  // Admin pode passar assinaturaId explicitamente (walk-in com crédito selecionado)
  // Nesse caso consome o crédito diretamente, sem buscar pelo telefone
  if (assinaturaIdExplicito && cobertoPorAssinaturaExplicito) {
    const consumido = await consumirCredito(String(assinaturaIdExplicito).slice(0, 64));
    if (consumido) {
      payload.assinaturaId = String(assinaturaIdExplicito).slice(0, 64);
      payload.cobertoPorAssinatura = true;
    }
  } else {
    // Fluxo público: verifica assinatura pelo telefone ou email
    const emailSanitizado = email ? String(email).slice(0, 200).toLowerCase().trim() : null;
    const assinatura = telefoneSanitizado.length >= 10
      ? (await getAssinaturaPorTelefone(telefoneSanitizado) ?? (emailSanitizado ? await getAssinaturaPorEmail(emailSanitizado) : null))
      : (emailSanitizado ? await getAssinaturaPorEmail(emailSanitizado) : null);

    if (assinatura) {
      const consumido = await consumirCredito(assinatura.id);
      if (consumido) {
        payload.assinaturaId = assinatura.id;
        payload.cobertoPorAssinatura = true;
      }
    }
  }

  // Modo de confirmação: "automatico" já cria confirmado e sinaliza pra avisar cliente
  const settings = await getLandingSettings().catch(() => null);
  if (settings?.autoConfirmMode === "automatico") {
    payload.status = "confirmado";
    payload.confirmadoAuto = true;
    payload.avisoPendente = true;
  }

  const id = await criarAgendamento(payload);

  // COMANDA: todo agendamento nasce como uma comanda aberta (a comanda é a fonte
  // de verdade do caixa/estoque/financeiro). O serviço vira o primeiro item.
  await criarComanda({
    origem: "agendamento",
    status: "aberta",
    clienteNome: nomeSanitizado,
    clienteTelefone: telefoneSanitizado,
    data,
    horario,
    barbeiroId: payload.barbeiroId,
    barbeiroNome: payload.barbeiroNome,
    itens: [{ id: "1", tipo: "servico", descricao: servicoSanitizado, valor: parsePriceNum(preco ?? "") }],
    total: parsePriceNum(preco ?? ""),
    cupom: payload.cupom,
    desconto: payload.desconto,
    assinaturaId: payload.assinaturaId,
    cobertoPorAssinatura: payload.cobertoPorAssinatura,
    agendamentoId: id,
  }).catch(() => {});

  // push em background — não bloqueia resposta ao cliente, mas roda até completar via after()
  const { title: pushTitle, body: pushBody } = pushNovoAgendamento({
    nome: nomeSanitizado, servico: servicoSanitizado, data, horario, barbeiroNome,
  });
  after(async () => {
    await sendPushToAll(pushTitle, pushBody).catch(() => {});
    if (payload.barbeiroId) {
      await sendPushToBarbeiro(payload.barbeiroId, pushTitle, pushBody).catch(() => {});
    }
  });

  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  const agendamentos = await listarAgendamentos();
  if (data) {
    return NextResponse.json(agendamentos.filter((a) => a.data === data && a.status !== "cancelado"));
  }
  return NextResponse.json(agendamentos);
}
