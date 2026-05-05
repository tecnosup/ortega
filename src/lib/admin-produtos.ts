import { adminDb } from "./firebase-admin";

export interface Produto {
  id: string;
  titulo: string;
  descricao: string;
  imagem: string;
  preco: string;
  status: "draft" | "published";
  order: number;
  createdAt: number;
  updatedAt: number;
}

export async function getProdutos(): Promise<Produto[]> {
  const snap = await adminDb.collection("produtos").orderBy("order").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Produto));
}

export async function getProdutoById(id: string): Promise<Produto | null> {
  const doc = await adminDb.collection("produtos").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Produto;
}

export async function createProduto(data: Omit<Produto, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const ref = await adminDb.collection("produtos").add({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateProduto(id: string, data: Partial<Omit<Produto, "id" | "createdAt">>) {
  await adminDb.collection("produtos").doc(id).update({ ...data, updatedAt: Date.now() });
}

export async function deleteProduto(id: string) {
  await adminDb.collection("produtos").doc(id).delete();
}

export async function getPublishedProdutos(): Promise<Produto[]> {
  const snap = await adminDb
    .collection("produtos")
    .where("status", "==", "published")
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Produto))
    .sort((a, b) => a.order - b.order);
}
