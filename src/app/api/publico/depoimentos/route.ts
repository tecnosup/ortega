import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const revalidate = 300;

const FALLBACK = [
  { id: "1", nome: "Ricardo Alves", texto: "Melhor barbearia da região! O Igor tem uma habilidade incrível com a navalha. Saio sempre renovado e bem tratado.", estrelas: 5 },
  { id: "2", nome: "Bruno Carvalho", texto: "Ambiente top, atendimento impecável. O combo corte + barba é simplesmente perfeito. Não troco por nada.", estrelas: 5 },
  { id: "3", nome: "Marcos Souza", texto: "Fui pela primeira vez indicado por um amigo e virei cliente fiel. A atenção aos detalhes faz toda a diferença.", estrelas: 5 },
];

export async function GET() {
  try {
    const snap = await getAdminDb().collection("depoimentos").orderBy("ordem").get();
    if (!snap.empty) {
      const depoimentos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ depoimentos });
    }
  } catch {
    // fallback se coleção não existir
  }
  return NextResponse.json({ depoimentos: FALLBACK });
}
