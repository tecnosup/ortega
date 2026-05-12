import { getAdminDb } from "./firebase-admin";

export interface Categoria {
  id: string;
  nome: string;
  order: number;
  createdAt: number;
}

export async function getCategorias(): Promise<Categoria[]> {
  const snap = await getAdminDb().collection("categoriasProdutos").orderBy("order").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Categoria));
}

export async function createCategoria(nome: string): Promise<string> {
  const db = getAdminDb();
  const snap = await db.collection("categoriasProdutos").orderBy("order", "desc").limit(1).get();
  const maxOrder = snap.empty ? 0 : (snap.docs[0].data().order as number) + 1;
  const ref = await db.collection("categoriasProdutos").add({ nome, order: maxOrder, createdAt: Date.now() });
  return ref.id;
}

export async function updateCategoria(id: string, nome: string): Promise<void> {
  await getAdminDb().collection("categoriasProdutos").doc(id).update({ nome });
}

export async function deleteCategoria(id: string): Promise<void> {
  await getAdminDb().collection("categoriasProdutos").doc(id).delete();
}
