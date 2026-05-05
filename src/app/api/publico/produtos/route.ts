import { NextResponse } from "next/server";
import { getPublishedProdutos } from "@/lib/admin-produtos";

export async function GET() {
  try {
    const produtos = await getPublishedProdutos();
    return NextResponse.json({ produtos });
  } catch {
    return NextResponse.json({ produtos: [] });
  }
}
