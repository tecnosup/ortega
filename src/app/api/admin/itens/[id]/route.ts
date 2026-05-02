import { NextRequest, NextResponse } from "next/server";
import { getItemById } from "@/lib/admin-items";
import { getSessionUser } from "@/lib/firebase-admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const item = await getItemById(id);
  return NextResponse.json({ item });
}
