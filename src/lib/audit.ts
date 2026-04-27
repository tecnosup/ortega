import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface AuditParams {
  actorUid: string;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string;
  summary?: string;
}

export async function logAudit(params: AuditParams) {
  await adminDb.collection("auditLogs").add({
    ...params,
    createdAt: FieldValue.serverTimestamp(),
  });
}
