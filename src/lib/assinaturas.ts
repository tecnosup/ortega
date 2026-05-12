import "server-only";
import { getAdminDb } from "./firebase-admin";

export type AssinaturaStatus = "ativa" | "cancelada" | "pausada" | "inadimplente";

export interface Assinatura {
  id: string;                  // Firestore doc id
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planoId: string;
  planoCortesTotal: number;    // créditos do plano (ex: 2)
  cortesRestantes: number;     // créditos disponíveis no ciclo atual
  status: AssinaturaStatus;
  // dados do cliente
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone?: string;
  // datas
  inicioEm: number;
  proximoVencimento: number;   // timestamp unix ms
  canceladaEm?: number;
  criadoEm: number;
  atualizadoEm: number;
}

const COL = "assinaturas";

export async function criarAssinatura(
  data: Omit<Assinatura, "id" | "criadoEm" | "atualizadoEm">
): Promise<string> {
  const db = getAdminDb();
  const now = Date.now();
  const ref = await db.collection(COL).add({ ...data, criadoEm: now, atualizadoEm: now });
  return ref.id;
}

export async function getAssinaturaPorStripeId(
  stripeSubscriptionId: string
): Promise<Assinatura | null> {
  const db = getAdminDb();
  const snap = await db.collection(COL).where("stripeSubscriptionId", "==", stripeSubscriptionId).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Assinatura;
}

export async function getAssinaturaPorEmail(email: string): Promise<Assinatura | null> {
  const db = getAdminDb();
  const snap = await db
    .collection(COL)
    .where("clienteEmail", "==", email)
    .where("status", "==", "ativa")
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Assinatura;
}

export async function getAssinaturaPorTelefone(telefone: string): Promise<Assinatura | null> {
  const db = getAdminDb();
  const snap = await db
    .collection(COL)
    .where("clienteTelefone", "==", telefone)
    .where("status", "==", "ativa")
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Assinatura;
}

export async function listarAssinaturas(): Promise<Assinatura[]> {
  const db = getAdminDb();
  const snap = await db.collection(COL).orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assinatura));
}

export async function atualizarAssinatura(
  id: string,
  data: Partial<Omit<Assinatura, "id" | "criadoEm">>
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COL).doc(id).update({ ...data, atualizadoEm: Date.now() });
}

export async function consumirCredito(id: string): Promise<boolean> {
  const db = getAdminDb();
  const ref = db.collection(COL).doc(id);
  // transação para evitar race condition
  return db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (!doc.exists) return false;
    const assinatura = doc.data() as Assinatura;
    if (assinatura.status !== "ativa" || assinatura.cortesRestantes <= 0) return false;
    t.update(ref, { cortesRestantes: assinatura.cortesRestantes - 1, atualizadoEm: Date.now() });
    return true;
  });
}
