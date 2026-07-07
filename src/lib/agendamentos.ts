import "server-only";
import { getAdminDb } from "./firebase-admin";
import type { Agendamento, FechamentoDia, AtendimentoAvulso } from "./agendamentos-types";

export type { AgendamentoStatus, Agendamento, FechamentoDia, AtendimentoAvulso } from "./agendamentos-types";
export { parsePriceNum } from "./agendamentos-types";

export async function criarAgendamento(
  data: Omit<Agendamento, "id" | "status" | "criadoEm" | "atualizadoEm">
    & Partial<Pick<Agendamento, "status" | "confirmadoAuto" | "avisoPendente">>
): Promise<string> {
  const now = Date.now();
  const db = getAdminDb();
  // status default = pendente, mas pode ser sobrescrito (ex: modo automático)
  const doc: Record<string, unknown> = { status: "pendente", visualizadoAdmin: false, criadoEm: now, atualizadoEm: now };
  // Remove campos undefined — Firestore rejeita undefined
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) doc[k] = v;
  }
  const ref = await db.collection("agendamentos").add(doc);
  return ref.id;
}

export async function listarAgendamentos(): Promise<Agendamento[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("agendamentos")
    .orderBy("criadoEm", "desc")
    .get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agendamento));
  // Ordena em memória: data desc, horario asc
  return docs.sort((a, b) => {
    if (a.data !== b.data) return b.data.localeCompare(a.data);
    return a.horario.localeCompare(b.horario);
  });
}

export async function getAgendamento(id: string): Promise<Agendamento | null> {
  const db = getAdminDb();
  const doc = await db.collection("agendamentos").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Agendamento;
}

export async function atualizarAgendamento(
  id: string,
  data: Partial<Omit<Agendamento, "id" | "criadoEm">>
): Promise<void> {
  const db = getAdminDb();
  const patch: Record<string, unknown> = { atualizadoEm: Date.now() };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) patch[k] = v;
  }
  await db.collection("agendamentos").doc(id).update(patch);
}

export async function excluirAgendamento(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("agendamentos").doc(id).delete();
}

export async function fecharCaixaDia(
  data: string,
  agendamentos: Agendamento[],
  avulsos: AtendimentoAvulso[] = [],
): Promise<string> {
  const concluidos = agendamentos.filter((a) => a.status === "concluido");
  const totalAgs = concluidos.reduce((sum, a) => {
    return sum + (parseFloat(a.preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0);
  }, 0);
  const totalAvulsos = avulsos.reduce((sum, av) => sum + av.total, 0);
  const db = getAdminDb();
  const ref = await db.collection("fechamentos").add({
    data,
    agendamentos: concluidos,
    avulsos,
    totalServicos: totalAgs + totalAvulsos,
    quantidadeAtendidos: concluidos.length + avulsos.length,
    fechadoEm: Date.now(),
  });
  return ref.id;
}

export async function listarFechamentos(): Promise<FechamentoDia[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("fechamentos")
    .orderBy("fechadoEm", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FechamentoDia));
}

export async function excluirFechamento(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("fechamentos").doc(id).delete();
}
