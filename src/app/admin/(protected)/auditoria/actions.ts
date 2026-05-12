"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  summary?: string;
  snapshotAntes?: Record<string, unknown>;
  createdAt: { _seconds: number } | number | null;
}

export type PeriodFilter = "30d" | "3m" | "6m" | "1y";

const PERIOD_MS: Record<PeriodFilter, number> = {
  "30d": 30 * 24 * 60 * 60 * 1000,
  "3m":  90 * 24 * 60 * 60 * 1000,
  "6m": 180 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
};

export async function loadMoreAuditLogs(afterId: string): Promise<AuditLog[]> {
  try {
    const db = getAdminDb();
    const cursorDoc = await db.collection("auditLogs").doc(afterId).get();
    if (!cursorDoc.exists) return [];

    const snap = await db
      .collection("auditLogs")
      .orderBy("createdAt", "desc")
      .startAfter(cursorDoc)
      .limit(50)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
  } catch {
    return [];
  }
}

export async function loadAuditLogsByPeriod(period: PeriodFilter): Promise<AuditLog[]> {
  try {
    const db = getAdminDb();
    const since = Timestamp.fromMillis(Date.now() - PERIOD_MS[period]);

    const snap = await db
      .collection("auditLogs")
      .orderBy("createdAt", "desc")
      .where("createdAt", ">=", since)
      .limit(500)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
  } catch {
    return [];
  }
}
