import "server-only";
import { getAdminDb } from "./firebase-admin";
import type { AtendimentoAvulso } from "./agendamentos-types";

export type { AtendimentoAvulso } from "./agendamentos-types";

export async function criarAtendimentoAvulso(
  data: Omit<AtendimentoAvulso, "id" | "criadoEm" | "atualizadoEm">
): Promise<string> {
  const now = Date.now();
  const db = getAdminDb();
  const doc: Record<string, unknown> = { ...data, criadoEm: now, atualizadoEm: now };
  if (!doc.clienteTelefone) delete doc.clienteTelefone;
  if (!doc.agendamentoId) delete doc.agendamentoId;
  const ref = await db.collection("atendimentos_avulsos").add(doc);
  return ref.id;
}

export async function listarAtendimentosAvulsosPorData(data: string): Promise<AtendimentoAvulso[]> {
  const db = getAdminDb();
  const snap = await db.collection("atendimentos_avulsos").where("data", "==", data).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AtendimentoAvulso));
}

export async function listarTodosAtendimentosAvulsos(): Promise<AtendimentoAvulso[]> {
  const db = getAdminDb();
  const snap = await db.collection("atendimentos_avulsos").orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AtendimentoAvulso));
}

export async function atualizarAtendimentoAvulso(
  id: string,
  patch: Partial<Omit<AtendimentoAvulso, "id" | "criadoEm">>
): Promise<void> {
  const db = getAdminDb();
  await db.collection("atendimentos_avulsos").doc(id).update({
    ...patch,
    atualizadoEm: Date.now(),
  });
}

export async function excluirAtendimentoAvulso(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("atendimentos_avulsos").doc(id).delete();
}
