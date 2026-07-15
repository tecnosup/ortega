"use client";

import { useState } from "react";
import {
  IconChevronDown, IconChevronUp, IconRotateClockwise2,
} from "@tabler/icons-react";
import { revertAuditAction } from "../produtos/actions";
import Modal from "@/components/ui/Modal";
import { useModalMount } from "@/components/ui/useModalMount";

interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  summary?: string;
  snapshotAntes?: Record<string, unknown>;
  createdAt: number | null; // milissegundos (normalizado no server)
}

const ACTION_BADGE: Record<string, { label: string; className: string }> = {
  "item.create":    { label: "CRIADO",      className: "bg-green-950 text-green-400 border-green-800" },
  "item.update":    { label: "ATUALIZADO",  className: "bg-yellow-950 text-[#b8944a] border-yellow-800" },
  "item.delete":    { label: "DELETADO",    className: "bg-red-950 text-red-400 border-red-800" },
  "produto.create": { label: "CRIADO",      className: "bg-green-950 text-green-400 border-green-800" },
  "produto.update": { label: "ATUALIZADO",  className: "bg-yellow-950 text-[#b8944a] border-yellow-800" },
  "produto.delete": { label: "DELETADO",    className: "bg-red-950 text-red-400 border-red-800" },
  "settings.update":{ label: "CONFIG",      className: "bg-blue-950 text-blue-400 border-blue-800" },
};

const REVERTABLE = new Set(["item.update", "item.delete", "produto.update", "produto.delete"]);

function formatDate(ts: number | null) {
  if (!ts) return "—";
  // já vem em milissegundos do server (normalizado) — não multiplicar de novo
  return new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function Badge({ action }: { action: string }) {
  const cfg = ACTION_BADGE[action];
  if (!cfg) return <span className="text-xs font-mono text-[#F5E6C8]">{action}</span>;
  return (
    <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function RevertModal({
  open,
  log,
  onClose,
  onSuccess,
}: {
  open: boolean;
  log: AuditLog;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("logId", log.id);
    const result = await revertAuditAction(fd);
    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error ?? "Erro ao reverter");
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center">
          <h2 className="text-[#F5E6C8] font-semibold">Confirmar reversão</h2>
        </div>

        <p className="text-sm text-gray-400">
          O estado abaixo será restaurado para <span className="font-mono text-gray-300">{log.entityId}</span>:
        </p>

        <pre className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg p-4 text-xs text-[#F5E6C8] overflow-auto max-h-60 whitespace-pre-wrap">
          {JSON.stringify(log.snapshotAntes, null, 2)}
        </pre>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 border border-[#2d2d2d] rounded-lg hover:border-gray-500 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-black bg-[#b8944a] rounded-lg hover:bg-[#C9A84C] transition disabled:opacity-50"
          >
            {loading ? "Revertendo..." : "Confirmar reversão"}
          </button>
        </div>
    </Modal>
  );
}

export default function AuditLogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reverted, setReverted] = useState(false);

  const canRevert = REVERTABLE.has(log.action) && !!log.snapshotAntes && !reverted;
  const revertMount = useModalMount(showModal && canRevert ? log : null);

  return (
    <>
      {revertMount.mounted && (
        <RevertModal
          open={revertMount.open}
          log={log}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setReverted(true); }}
        />
      )}

      <div className="px-5 py-4 hover:bg-[#151515] transition">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge action={log.action} />
              <span className="text-xs font-mono text-gray-500">{log.action}</span>
              {log.entity && (
                <span className="text-xs text-gray-600">· {log.entity}</span>
              )}
            </div>

            {log.summary ? (
              <p className="text-sm text-[#F5E6C8] mt-0.5">{log.summary}</p>
            ) : (
              <p className="text-xs text-gray-600 font-mono mt-0.5">{log.entityId}</p>
            )}

            <p className="text-xs text-gray-600 mt-0.5">{log.actorEmail}</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</span>

            <div className="flex items-center gap-2">
              {log.snapshotAntes && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#F5E6C8] transition"
                >
                  {expanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
                  {expanded ? "Ocultar" : "Detalhes"}
                </button>
              )}

              {reverted ? (
                <span className="text-xs text-green-400">Revertido</span>
              ) : canRevert ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 border border-[#2d2d2d] text-gray-500 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition"
                >
                  <IconRotateClockwise2 size={11} />
                  Reverter
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {expanded && log.snapshotAntes && (
          <pre className="mt-3 bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg p-4 text-xs text-[#F5E6C8] overflow-auto max-h-60 whitespace-pre-wrap">
            {JSON.stringify(log.snapshotAntes, null, 2)}
          </pre>
        )}
      </div>
    </>
  );
}
