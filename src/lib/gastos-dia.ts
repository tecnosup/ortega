import "server-only";
import { getAdminDb } from "./firebase-admin";
import type { GastoDia } from "./gastos-dia-tipos";

export type { GastoDia } from "./gastos-dia-tipos";

export async function criarGastoDia(data: Omit<GastoDia, "id" | "criadoEm">): Promise<string> {
  const db = getAdminDb();
  const ref = await db.collection("gastos_dia").add({ ...data, criadoEm: Date.now() });
  return ref.id;
}

export async function listarGastosDia(): Promise<GastoDia[]> {
  const db = getAdminDb();
  const snap = await db.collection("gastos_dia").orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GastoDia));
}

export async function excluirGastoDia(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("gastos_dia").doc(id).delete();
}
