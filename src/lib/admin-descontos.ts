import { adminDb } from "./firebase-admin";

export interface Desconto {
  id: string;
  tipo: "item" | "produto";
  entityId: string;
  entityTitulo: string;
  percentual: number;
  inicioAt: number;
  fimAt: number;
  ativo: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function getDescontos(): Promise<Desconto[]> {
  const snap = await adminDb.collection("descontos").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Desconto));
}

export async function getDescontoById(id: string): Promise<Desconto | null> {
  const doc = await adminDb.collection("descontos").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Desconto;
}

export async function createDesconto(data: Omit<Desconto, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const ref = await adminDb.collection("descontos").add({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateDesconto(id: string, data: Partial<Omit<Desconto, "id" | "createdAt">>) {
  await adminDb.collection("descontos").doc(id).update({ ...data, updatedAt: Date.now() });
}

export async function deleteDesconto(id: string) {
  await adminDb.collection("descontos").doc(id).delete();
}

export async function getActiveDescontos(): Promise<Desconto[]> {
  const now = Date.now();
  const snap = await adminDb
    .collection("descontos")
    .where("ativo", "==", true)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Desconto))
    .filter((d) => d.inicioAt <= now && d.fimAt >= now);
}
