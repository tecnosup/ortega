import { NextRequest, NextResponse } from "next/server";
import { getLandingSettings, updateLandingSettings } from "@/lib/admin-settings";
import { getSessionUser } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getLandingSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await updateLandingSettings(body);
  return NextResponse.json({ ok: true });
}
