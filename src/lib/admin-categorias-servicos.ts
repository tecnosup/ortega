import "server-only";
import { getAdminDb } from "./firebase-admin";

export interface CategoriaServico {
  id: string;
  nome: string;
  order: number;
  createdAt: number;
}

export async function getCategoriasServicos(): Promise<CategoriaServico[]> {
  const snap = await getAdminDb().collection("categoriasServicos").orderBy("order").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoriaServico));
}

export async function createCategoriaServico(nome: string): Promise<string> {
  const db = getAdminDb();
  const snap = await db.collection("categoriasServicos").orderBy("order", "desc").limit(1).get();
  const maxOrder = snap.empty ? 0 : (snap.docs[0].data().order as number) + 1;
  const ref = await db.collection("categoriasServicos").add({ nome, order: maxOrder, createdAt: Date.now() });
  return ref.id;
}

export async function updateCategoriaServico(id: string, nome: string): Promise<void> {
  await getAdminDb().collection("categoriasServicos").doc(id).update({ nome });
}

export async function deleteCategoriaServico(id: string): Promise<void> {
  await getAdminDb().collection("categoriasServicos").doc(id).delete();
}
