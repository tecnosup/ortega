import { NextResponse } from "next/server";
import { getLandingSettings } from "@/lib/admin-settings";
import { adminDb } from "@/lib/firebase-admin";
import { mesclarGrade, type GradeConfig } from "@/lib/grade";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getLandingSettings();
    const gradeDoc = await adminDb.collection("settings").doc("grade").get();
    const grade = mesclarGrade(
      gradeDoc.exists ? (gradeDoc.data() as Partial<Record<number, GradeConfig[number]>>) : null
    );
    return NextResponse.json({ ...settings, grade });
  } catch {
    return NextResponse.json({ whatsappNumber: "5512982585538" });
  }
}
