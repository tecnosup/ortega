
import { getAdminDb } from "@/lib/firebase-admin";
import {
  IconShieldCheck,
} from "@tabler/icons-react";
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
  createdAt: number | null; // milissegundos (normalizado na fonte)
}

// Timestamp do Firestore → milissegundos. Antes o server mandava segundos e o
// front usava como ms → tudo virava "21/01/1970". Convertendo aqui, corrige.
function tsParaMs(ts: unknown): number | null {
  if (!ts) return null;
  if (typeof ts === "number") return ts;
  const o = ts as { _seconds?: number; seconds?: number; toMillis?: () => number };
  if (typeof o.toMillis === "function") return o.toMillis();
  const s = o._seconds ?? o.seconds;
  return typeof s === "number" ? s * 1000 : null;
}

export default async function AuditoriaPage() {
  let logs: AuditLog[] = [];
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("auditLogs")
      .orderBy("createdAt", "desc")
      .limit(25) // "Recentes" mostra poucos; o resto vem no "Ver mais" (−75% de leitura ao abrir)
      .get();
    logs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        actorEmail: data.actorEmail ?? "",
        action: data.action ?? "",
        entity: data.entity ?? "",
        entityId: data.entityId ?? "",
        summary: data.summary ?? undefined,
        snapshotAntes: data.snapshotAntes ?? undefined,
        createdAt: tsParaMs(data.createdAt),
      } as AuditLog;
    });
  } catch {
    // silencia erro de índice/conexão
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <IconShieldCheck size={22} className="text-[#b8944a]" />
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
