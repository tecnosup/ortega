import { NextResponse } from "next/server";
import { getPublishedItems } from "@/lib/admin-items";

export const revalidate = 60;

export async function GET() {
  const items = await getPublishedItems();
  return NextResponse.json({ items });
}
