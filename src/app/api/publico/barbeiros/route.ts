import { NextResponse } from "next/server";
import { listBarbeirosAtivos } from "@/lib/barbeiros";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const barbeiros = await listBarbeirosAtivos();
    return NextResponse.json({ barbeiros });
  } catch {
    return NextResponse.json({ barbeiros: [] });
  }
}
