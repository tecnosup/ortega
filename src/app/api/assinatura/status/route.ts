import { NextRequest, NextResponse } from "next/server";
import { getAssinaturaPorEmail, getAssinaturaPorTelefone } from "@/lib/assinaturas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/assinatura/status?email=x ou ?telefone=x
export async function GET(req: NextRequest) {
  if (!rateLimit(`assinatura-status:${getClientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  }

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  const telefone = req.nextUrl.searchParams.get("telefone")?.replace(/\D/g, "");

  if (!email && !telefone) {
    return NextResponse.json({ error: "Informe email ou telefone" }, { status: 400 });
  }

  const assinatura = email
    ? await getAssinaturaPorEmail(email)
    : await getAssinaturaPorTelefone(telefone!);

  if (!assinatura) return NextResponse.json({ assinatura: null });

  // retorna apenas campos necessários para o cliente (não expõe IDs internos)
  return NextResponse.json({
    assinatura: {
      id: assinatura.id,
      planoId: assinatura.planoId,
      planoCortesTotal: assinatura.planoCortesTotal,
      cortesRestantes: assinatura.cortesRestantes,
      status: assinatura.status,
      proximoVencimento: assinatura.proximoVencimento,
      clienteNome: assinatura.clienteNome,
    },
  });
}
