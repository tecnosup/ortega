import { ShieldCheck } from "lucide-react";
import { getAdminDb } from "@/lib/firebase-admin";
import AuditList from "./AuditList";

export const dynamic = "force-dynamic";

interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  summary?: string;
  snapshotAntes?: Record<string, unknown>;
  createdAt: { _seconds: number } | number | null;
}

export default async function AuditoriaPage() {
  let logs: AuditLog[] = [];
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("auditLogs")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
  } catch {
    // silencia erro de índice/conexão
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ShieldCheck size={22} className="text-[#b8944a]" />
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Auditoria</h1>
      </div>

      {logs.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhuma ação registrada ainda.</p>
      ) : (
        <AuditList initialLogs={logs} />
      )}
    </div>
  );
}
