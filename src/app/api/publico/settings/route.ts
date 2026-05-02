import { NextResponse } from "next/server";
import { getLandingSettings } from "@/lib/admin-settings";

export const revalidate = 60;

export async function GET() {
  const settings = await getLandingSettings();
  return NextResponse.json(settings);
}
