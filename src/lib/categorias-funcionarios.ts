import "server-only";
import { getAdminDb } from "./firebase-admin";

export interface CategoriaFuncionario {
  id: string;
  nome: string;
  order: number;
  createdAt: number;
}

export async function listCategoriasFuncionarios(): Promise<CategoriaFuncionario[]> {
  const snap = await getAdminDb().collection("categoriasFuncionarios").orderBy("order").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoriaFuncionario));
}

export async function createCategoriaFuncionario(nome: string): Promise<string> {
  const db = getAdminDb();
  const snap = await db.collection("categoriasFuncionarios").orderBy("order", "desc").limit(1).get();
  const maxOrder = snap.empty ? 0 : (snap.docs[0].data().order as number) + 1;
  const ref = await db.collection("categoriasFuncionarios").add({ nome, order: maxOrder, createdAt: Date.now() });
  return ref.id;
}

export async function updateCategoriaFuncionario(id: string, nome: string): Promise<void> {
  await getAdminDb().collection("categoriasFuncionarios").doc(id).update({ nome });
}

export async function deleteCategoriaFuncionario(id: string): Promise<void> {
  await getAdminDb().collection("categoriasFuncionarios").doc(id).delete();
}
