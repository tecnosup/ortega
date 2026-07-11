import { NextResponse } from "next/server";
import { getCategoriasServicos } from "@/lib/admin-categorias-servicos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categorias = await getCategoriasServicos();
    return NextResponse.json({ categorias });
  } catch {
    return NextResponse.json({ categorias: [] });
  }
}
