import "server-only";
import { getAdminDb } from "./firebase-admin";
import type { Assinatura } from "./assinaturas";
import type { ClienteSession } from "./cliente-auth";

export async function getAssinaturaDoCliente(session: ClienteSession): Promise<Assinatura | null> {
  const db = getAdminDb();
  const doc = await db.collection("assinaturas").doc(session.assinaturaId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Assinatura;
}
