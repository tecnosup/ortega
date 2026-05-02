import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await getAdminDb().collection("depoimentos").orderBy("ordem").get();
    const depoimentos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ depoimentos });
  } catch {
    return NextResponse.json({ depoimentos: [] });
  }
}
