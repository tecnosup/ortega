import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getClienteSession } from "@/lib/cliente-auth";
import { getAssinaturaDoCliente } from "@/lib/cliente-auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = getClienteSession(req);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const assinatura = await getAssinaturaDoCliente(session);
  if (!assinatura) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

  const db = getAdminDb();

  // Busca por telefone (campo principal de identificação)
  const queries = [
    db.collection("agendamentos")
      .where("telefone", "==", assinatura.clienteTelefone ?? "")
      .orderBy("criadoEm", "desc")
      .limit(50)
      .get(),
  ];

  // Também busca por assinaturaId para pegar agendamentos sem telefone
  if (assinatura.id) {
    queries.push(
      db.collection("agendamentos")
        .where("assinaturaId", "==", assinatura.id)
        .orderBy("criadoEm", "desc")
        .limit(50)
        .get()
    );
  }

  const snaps = await Promise.all(queries);
  const seen = new Set<string>();
  const agendamentos: Record<string, unknown>[] = [];

  for (const snap of snaps) {
    for (const doc of snap.docs) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      agendamentos.push({ id: doc.id, ...doc.data() });
    }
  }

  agendamentos.sort((a, b) => (b.criadoEm as number) - (a.criadoEm as number));

  return NextResponse.json({ agendamentos });
}
