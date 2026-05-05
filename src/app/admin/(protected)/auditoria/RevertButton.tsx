"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { revertAuditAction } from "../produtos/actions";

export default function RevertButton({ logId, action }: { logId: string; action: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevert() {
    if (!confirm(`Reverter a ação "${action}"?`)) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("logId", logId);
    const result = await revertAuditAction(fd);
    if (result.ok) {
      setDone(true);
    } else {
      setError(result.error ?? "Erro ao reverter");
    }
    setLoading(false);
  }

  if (done) {
    return <span className="text-xs text-green-400">Revertido</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRevert}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1 border border-[#2d2d2d] text-gray-500 text-xs rounded hover:border-[#b8944a] hover:text-[#b8944a] transition disabled:opacity-40"
      >
        <RotateCcw size={11} />
        {loading ? "..." : "Reverter"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
