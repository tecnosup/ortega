import "server-only";
import { getAdminDb } from "./firebase-admin";
import type { CategoriaGastoCustom } from "./gastos-tipos";

export type { CategoriaGastoCustom } from "./gastos-tipos";

export async function listarCategorias(): Promise<CategoriaGastoCustom[]> {
  const db = getAdminDb();
  const snap = await db.collection("categorias_gasto").orderBy("ordem").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoriaGastoCustom));
}

export async function criarCategoria(data: Omit<CategoriaGastoCustom, "id" | "criadoEm">): Promise<string> {
  const db = getAdminDb();
  const ref = await db.collection("categorias_gasto").add({ ...data, criadoEm: Date.now() });
  return ref.id;
}

export async function atualizarCategoria(id: string, data: Partial<Omit<CategoriaGastoCustom, "id" | "criadoEm">>): Promise<void> {
  const db = getAdminDb();
  await db.collection("categorias_gasto").doc(id).update(data);
}

export async function excluirCategoria(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("categorias_gasto").doc(id).delete();
}
