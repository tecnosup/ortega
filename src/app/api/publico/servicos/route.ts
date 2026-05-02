import { NextResponse } from "next/server";
import { getPublishedItems } from "@/lib/admin-items";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getPublishedItems();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
