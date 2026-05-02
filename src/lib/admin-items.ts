import { adminDb } from "./firebase-admin";

export interface Item {
  id: string;
  titulo: string;
  descricao: string;
  imagem: string;
  preco: string;
  duracao: string;
  status: "draft" | "published";
  order: number;
  createdAt: number;
  updatedAt: number;
}

export async function getItems(): Promise<Item[]> {
  const snap = await adminDb.collection("servicos").orderBy("order").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
}

export async function getItemById(id: string): Promise<Item | null> {
  const doc = await adminDb.collection("servicos").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Item;
}

export async function createItem(data: Omit<Item, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const ref = await adminDb.collection("servicos").add({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateItem(id: string, data: Partial<Omit<Item, "id" | "createdAt">>) {
  await adminDb.collection("servicos").doc(id).update({ ...data, updatedAt: Date.now() });
}

export async function deleteItem(id: string) {
  await adminDb.collection("servicos").doc(id).delete();
}

export async function getPublishedItems(): Promise<Item[]> {
  const snap = await adminDb
    .collection("servicos")
    .where("status", "==", "published")
    .orderBy("order")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
}
