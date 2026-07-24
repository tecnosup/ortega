import "server-only";
import { getAdminDb } from "./firebase-admin";
import { marcarFechamentoCriado, marcarFechamentoExcluido } from "./caixas-abertos-agg";
import type { Agendamento, FechamentoDia, AtendimentoAvulso } from "./agendamentos-types";
import type { Comanda } from "./comandas-types";

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
  comandas: Comanda[] = [],
): Promise<string> {
  // Comandas finalizadas são a fonte de verdade do faturamento no novo modelo.
  const finalizadas = comandas.filter((c) => c.status === "finalizada");
  const totalComandas = finalizadas.reduce((sum, c) => sum + (c.total || 0), 0);
  // Evita DUPLA CONTAGEM: se um agendamento concluído já tem comanda finalizada,
  // ele já foi contado em totalComandas — não soma de novo em totalAgs.
  const idsAgComComanda = new Set(finalizadas.map((c) => c.agendamentoId).filter(Boolean));
  const concluidos = agendamentos.filter((a) => a.status === "concluido");
  const concluidosSemComanda = concluidos.filter((a) => !idsAgComComanda.has(a.id));
  const totalAgs = concluidosSemComanda.reduce((sum, a) => {
    return sum + (parseFloat(a.preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0);
  }, 0);
  const totalAvulsos = avulsos.reduce((sum, av) => sum + av.total, 0);
  const db = getAdminDb();
  const ref = await db.collection("fechamentos").add({
    data,
    // grava só os concluídos que NÃO viraram comanda (os demais já estão em `comandas`)
    agendamentos: concluidosSemComanda,
    avulsos,
    comandas: finalizadas,
    totalServicos: totalAgs + totalAvulsos + totalComandas,
    quantidadeAtendidos: concluidosSemComanda.length + avulsos.length + finalizadas.length,
    fechadoEm: Date.now(),
  });
  // Agregador de caixas abertos: este dia deixou de estar "aberto".
  await marcarFechamentoCriado(data);
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
  // Lê a data antes de excluir para reconciliar o agregador (o dia pode voltar a "aberto").
  const doc = await db.collection("fechamentos").doc(id).get();
  const data = (doc.data()?.data as string | undefined) ?? "";
  await db.collection("fechamentos").doc(id).delete();
  if (data) await marcarFechamentoExcluido(data);
}
