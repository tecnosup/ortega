import { adminDb } from "./firebase-admin";
export type { CategoriaGasto, FrequenciaGasto, Gasto } from "./gastos-tipos";
import type { Gasto } from "./gastos-tipos";

export async function criarGasto(data: Omit<Gasto, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
  const now = Date.now();
  const ref = await adminDb.collection("gastos").add({ ...data, criadoEm: now, atualizadoEm: now });
  return ref.id;
}

export async function listarGastos(): Promise<Gasto[]> {
  const snap = await adminDb.collection("gastos").orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Gasto));
}

export async function atualizarGasto(id: string, data: Partial<Omit<Gasto, "id" | "criadoEm">>): Promise<void> {
  await adminDb.collection("gastos").doc(id).update({ ...data, atualizadoEm: Date.now() });
}

export async function excluirGasto(id: string): Promise<void> {
  await adminDb.collection("gastos").doc(id).delete();
}

