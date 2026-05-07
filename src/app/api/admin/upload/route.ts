import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase-admin";
import { uploadToR2, isR2Configured } from "@/lib/r2";

// Receives the file directly and uploads to Cloudflare R2.
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isR2Configured) {
    return NextResponse.json({ error: "Storage não configurado." }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "ortega";

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 10 MB)" }, { status: 413 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Formato não permitido. Use JPG, PNG, WebP ou GIF." }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadToR2(buffer, file.type, folder);

  return NextResponse.json({ url: result.publicUrl });
}
