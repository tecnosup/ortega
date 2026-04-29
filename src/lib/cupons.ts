import { adminDb } from "./firebase-admin";

export type TipoCupom = "percentual" | "fixo";

export interface Cupom {
  id: string;
  codigo: string;         // ex: "ORTEGA10"
  descricao: string;
  tipo: TipoCupom;        // "percentual" | "fixo"
  valor: number;          // ex: 10 (%) ou 15 (R$)
  ativo: boolean;
  usoMaximo: number | null;  // null = ilimitado
  usoAtual: number;
  criadoEm: number;
  atualizadoEm: number;
}

export interface ValidacaoCupom {
  valido: boolean;
  cupom?: Cupom;
  mensagem?: string;
}

export async function criarCupom(data: Omit<Cupom, "id" | "usoAtual" | "criadoEm" | "atualizadoEm">): Promise<string> {
  const now = Date.now();
  const codigoNorm = data.codigo.toUpperCase().trim();

  const existente = await adminDb.collection("cupons").where("codigo", "==", codigoNorm).get();
  if (!existente.empty) throw new Error("Código de cupom já existe.");

  const ref = await adminDb.collection("cupons").add({
    ...data,
    codigo: codigoNorm,
    usoAtual: 0,
    criadoEm: now,
    atualizadoEm: now,
  });
  return ref.id;
}

export async function listarCupons(): Promise<Cupom[]> {
  const snap = await adminDb.collection("cupons").orderBy("criadoEm", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cupom));
}

export async function getCupom(id: string): Promise<Cupom | null> {
  const doc = await adminDb.collection("cupons").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Cupom;
}

export async function atualizarCupom(id: string, data: Partial<Omit<Cupom, "id" | "usoAtual" | "criadoEm">>): Promise<void> {
  const payload: Record<string, unknown> = { ...data, atualizadoEm: Date.now() };
  if (data.codigo) payload.codigo = (data.codigo as string).toUpperCase().trim();
  await adminDb.collection("cupons").doc(id).update(payload);
}

export async function excluirCupom(id: string): Promise<void> {
  await adminDb.collection("cupons").doc(id).delete();
}

export async function validarCupom(codigo: string): Promise<ValidacaoCupom> {
  const codigoNorm = codigo.toUpperCase().trim();
  const snap = await adminDb.collection("cupons").where("codigo", "==", codigoNorm).limit(1).get();

  if (snap.empty) return { valido: false, mensagem: "Cupom não encontrado." };

  const cupom = { id: snap.docs[0].id, ...snap.docs[0].data() } as Cupom;

  if (!cupom.ativo) return { valido: false, mensagem: "Cupom inativo." };
  if (cupom.usoMaximo !== null && cupom.usoAtual >= cupom.usoMaximo) {
    return { valido: false, mensagem: "Cupom esgotado." };
  }

  return { valido: true, cupom };
}

export async function incrementarUsoCupom(codigo: string): Promise<void> {
  const codigoNorm = codigo.toUpperCase().trim();
  const snap = await adminDb.collection("cupons").where("codigo", "==", codigoNorm).limit(1).get();
  if (snap.empty) return;
  await snap.docs[0].ref.update({
    usoAtual: snap.docs[0].data().usoAtual + 1,
    atualizadoEm: Date.now(),
  });
}

export function calcularDesconto(cupom: Cupom, precoOriginal: number): number {
  if (cupom.tipo === "percentual") {
    return parseFloat(((precoOriginal * cupom.valor) / 100).toFixed(2));
  }
  return Math.min(cupom.valor, precoOriginal);
}
