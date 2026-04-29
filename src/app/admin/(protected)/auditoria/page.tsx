"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

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

const ACTION_COLOR: Record<string, string> = {
  "item.create": "text-green-400",
  "item.update": "text-[#b8944a]",
  "item.delete": "text-red-400",
  "settings.update": "text-blue-400",
};

export default function AuditoriaPage() {
  const [logs] = useState<AuditLog[]>(DEMO_LOGS);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ShieldCheck size={22} className="text-[#b8944a]" />
        <h1 className="text-2xl font-bold text-[#F5E6C8]">Auditoria</h1>
      </div>

      <p className="text-sm text-[#b8944a]/80 bg-[#b8944a]/10 border border-[#b8944a]/20 rounded-lg px-4 py-2.5">
        Modo demo — logs simulados. Conecte o Firestore para ver ações reais.
      </p>

      {logs.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhuma ação registrada.</p>
      ) : (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg divide-y divide-[#1a1a1a]">
          {logs.map((log) => (
            <div key={log.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-[#151515] transition">
              <div>
                <p className={`text-sm font-semibold font-mono ${ACTION_COLOR[log.action] ?? "text-[#F5E6C8]"}`}>
                  {log.action}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {log.actorEmail} · {log.entity} <span className="text-gray-600 font-mono">{log.entityId}</span>
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
