import "server-only";
import { getAdminDb } from "./firebase-admin";
import type { Barbeiro } from "./barbeiros-types";

export type { Barbeiro } from "./barbeiros-types";

export async function listBarbeiros(): Promise<Barbeiro[]> {
  const db = getAdminDb();
  const snap = await db.collection("barbeiros").orderBy("nome").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Barbeiro));
}

export async function listBarbeirosAtivos(): Promise<Barbeiro[]> {
  const db = getAdminDb();
  const snap = await db.collection("barbeiros").where("ativo", "==", true).orderBy("nome").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Barbeiro));
}

export async function getBarbeiro(id: string): Promise<Barbeiro | null> {
  const db = getAdminDb();
  const doc = await db.collection("barbeiros").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Barbeiro;
}

export async function createBarbeiro(
  data: Omit<Barbeiro, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getAdminDb();
  const now = Date.now();
  const clean = Object.fromEntries(
    Object.entries({ ...data, createdAt: now, updatedAt: now }).filter(([, v]) => v !== undefined)
  );
  const ref = await db.collection("barbeiros").add(clean);
  return ref.id;
}

export async function updateBarbeiro(
  id: string,
  data: Partial<Omit<Barbeiro, "id" | "createdAt">>
): Promise<void> {
  const db = getAdminDb();
  const clean = Object.fromEntries(
    Object.entries({ ...data, updatedAt: Date.now() }).filter(([, v]) => v !== undefined)
  );
  await db.collection("barbeiros").doc(id).update(clean);
}

export async function deleteBarbeiro(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection("barbeiros").doc(id).delete();
}
