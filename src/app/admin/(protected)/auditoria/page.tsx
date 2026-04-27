export const dynamic = "force-dynamic";

import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

interface AuditLog {
  id: string;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string;
  summary?: string;
  createdAt: Timestamp | null;
}

export default async function AuditoriaPage() {
  const snap = await adminDb
    .collection("auditLogs")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  const logs: AuditLog[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<AuditLog, "id">),
  }));

  function formatDate(ts: Timestamp | null) {
    if (!ts) return "—";
    return ts.toDate().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Auditoria</h1>

      {logs.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhuma ação registrada.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{log.action}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {log.actorEmail ?? "—"} · {log.entity} {log.entityId}
                  {log.summary && ` · ${log.summary}`}
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(log.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
