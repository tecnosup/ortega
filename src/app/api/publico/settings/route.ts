import { NextResponse } from "next/server";
import { getLandingSettings } from "@/lib/admin-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getLandingSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ whatsappNumber: "5512982585538" });
  }
}
