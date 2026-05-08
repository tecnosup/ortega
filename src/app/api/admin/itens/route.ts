import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { getItems } from "@/lib/admin-items";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await getItems();
  return NextResponse.json({ items });
}
