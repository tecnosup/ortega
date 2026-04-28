import { adminDb } from "./firebase-admin";

export type AgendamentoStatus = "pendente" | "confirmado" | "cancelado" | "concluido" | "nao_compareceu";

export interface Agendamento {
  id: string;
  nome: string;
  telefone: string;
  servico: string;
  preco: string;
  data: string;       // "YYYY-MM-DD"
  horario: string;    // "HH:MM"
  status: AgendamentoStatus;
  criadoEm: number;
  atualizadoEm: number;
}

export interface FechamentoDia {
  id: string;
  data: string;           // "YYYY-MM-DD"
  agendamentos: Agendamento[];
  totalServicos: number;
  quantidadeAtendidos: number;
  fechadoEm: number;
}

export async function criarAgendamento(
  data: Omit<Agendamento, "id" | "status" | "criadoEm" | "atualizadoEm">
): Promise<string> {
  const now = Date.now();
  const ref = await adminDb.collection("agendamentos").add({
    ...data,
    status: "pendente",
    criadoEm: now,
    atualizadoEm: now,
  });
  return ref.id;
}

export async function listarAgendamentos(): Promise<Agendamento[]> {
  const snap = await adminDb
    .collection("agendamentos")
    .orderBy("data", "desc")
    .orderBy("horario", "asc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agendamento));
}

export async function getAgendamento(id: string): Promise<Agendamento | null> {
  const doc = await adminDb.collection("agendamentos").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Agendamento;
}

export async function atualizarAgendamento(
  id: string,
  data: Partial<Omit<Agendamento, "id" | "criadoEm">>
): Promise<void> {
  await adminDb.collection("agendamentos").doc(id).update({
    ...data,
    atualizadoEm: Date.now(),
  });
}

export async function excluirAgendamento(id: string): Promise<void> {
  await adminDb.collection("agendamentos").doc(id).delete();
}

export async function fecharCaixaDia(data: string, agendamentos: Agendamento[]): Promise<string> {
  const concluidos = agendamentos.filter((a) => a.status === "concluido");
  const total = concluidos.reduce((sum, a) => {
    const val = parseFloat(a.preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    return sum + val;
  }, 0);
  const ref = await adminDb.collection("fechamentos").add({
    data,
    agendamentos: concluidos,
    totalServicos: total,
    quantidadeAtendidos: concluidos.length,
    fechadoEm: Date.now(),
  });
  return ref.id;
}

export async function listarFechamentos(): Promise<FechamentoDia[]> {
  const snap = await adminDb
    .collection("fechamentos")
    .orderBy("data", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FechamentoDia));
}
