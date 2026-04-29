"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";

// DEMO MODE: auditoria simulada em memória — conectar ao Firestore na produção
interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: number;
}

const DEMO_LOGS: AuditLog[] = [
  { id: "1", actorEmail: "admin@ortegabarber.com.br", action: "item.create", entity: "servico", entityId: "abc123", createdAt: Date.now() - 1000 * 60 * 5 },
  { id: "2", actorEmail: "admin@ortegabarber.com.br", action: "item.update", entity: "servico", entityId: "abc123", createdAt: Date.now() - 1000 * 60 * 30 },
  { id: "3", actorEmail: "admin@ortegabarber.com.br", action: "settings.update", entity: "settings", entityId: "landing", createdAt: Date.now() - 1000 * 60 * 60 * 2 },
  { id: "4", actorEmail: "admin@ortegabarber.com.br", action: "item.delete", entity: "servico", entityId: "xyz456", createdAt: Date.now() - 1000 * 60 * 60 * 5 },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default function AuditoriaPage() {
  const [logs] = useState<AuditLog[]>(DEMO_LOGS);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Auditoria</h1>
      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-8">
        Modo demo — logs simulados. Conecte o Firestore para ver ações reais.
      </p>

      {logs.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhuma ação registrada.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{log.action}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {log.actorEmail} · {log.entity} {log.entityId}
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
