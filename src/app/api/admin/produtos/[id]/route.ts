import { NextRequest, NextResponse } from "next/server";
import { getProdutoById } from "@/lib/admin-produtos";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("base_admin_session")?.value ?? "";
  try {
    await adminAuth.verifySessionCookie(session, true);
    return true;
  } catch {
    return false;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const produto = await getProdutoById(id);
  return NextResponse.json({ produto });
}
