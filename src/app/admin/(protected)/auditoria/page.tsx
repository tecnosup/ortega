import { ShieldCheck } from "lucide-react";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: { _seconds: number } | number | null;
}

const ACTION_COLOR: Record<string, string> = {
  "item.create": "text-green-400",
  "item.update": "text-[#b8944a]",
  "item.delete": "text-red-400",
  "settings.update": "text-blue-400",
};

function formatDate(ts: { _seconds: number } | number | null) {
  if (!ts) return "—";
  const ms = typeof ts === "number" ? ts : ts._seconds * 1000;
  return new Date(ms).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default async function AuditoriaPage() {
  let logs: AuditLog[] = [];
  try {
    const snap = await adminDb
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
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg divide-y divide-[#1a1a1a]">
          {logs.map((log) => (
            <div key={log.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-[#151515] transition">
              <div>
                <p className={`text-sm font-semibold font-mono ${ACTION_COLOR[log.action] ?? "text-[#F5E6C8]"}`}>
                  {log.action}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {log.actorEmail} · {log.entity}{" "}
                  <span className="text-gray-600 font-mono">{log.entityId}</span>
                </p>
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap shrink-0">{formatDate(log.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
