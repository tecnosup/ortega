import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getAdminDb } from "@/lib/firebase-admin";
import { getClienteSession } from "@/lib/cliente-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = getClienteSession(req);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const db = getAdminDb();
  const doc = await db.collection("assinaturas").doc(session.assinaturaId).get();
  if (!doc.exists) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

  const data = doc.data()!;
  return NextResponse.json({
    assinatura: {
      id: doc.id,
      planoId: data.planoId,
      planoCortesTotal: data.planoCortesTotal,
      cortesRestantes: data.cortesRestantes,
      status: data.status,
      proximoVencimento: data.proximoVencimento,
      clienteNome: data.clienteNome,
      clienteEmail: data.clienteEmail,
      clienteTelefone: data.clienteTelefone ?? "",
    },
  });
}

export async function PATCH(req: NextRequest) {
  if (!rateLimit(`cliente-perfil:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  }

  const session = getClienteSession(req);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json() as { nome?: string; telefone?: string; senhaAtual?: string; novaSenha?: string };
  const db = getAdminDb();
  const ref = db.collection("assinaturas").doc(session.assinaturaId);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const patch: Record<string, unknown> = { atualizadoEm: Date.now() };

  if (body.nome) patch.clienteNome = String(body.nome).trim().slice(0, 100);
  if (body.telefone !== undefined) patch.clienteTelefone = String(body.telefone).replace(/\D/g, "").slice(0, 15);

  if (body.novaSenha) {
    if (!body.senhaAtual) {
      return NextResponse.json({ error: "Informe a senha atual para alterar a senha" }, { status: 400 });
    }
    if (String(body.novaSenha).length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter no mínimo 6 caracteres" }, { status: 400 });
    }
    const { compare } = await import("bcryptjs");
    const atual = doc.data()?.senhaHash as string | undefined;
    if (!atual || !(await compare(String(body.senhaAtual), atual))) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 403 });
    }
    patch.senhaHash = await hash(String(body.novaSenha), 12);
  }

  await ref.update(patch);
  return NextResponse.json({ ok: true });
}
