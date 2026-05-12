"use client";

import { useState } from "react";
import AuditLogRow from "./AuditLogRow";
import { loadMoreAuditLogs, loadAuditLogsByPeriod } from "./actions";
import type { AuditLog, PeriodFilter } from "./actions";

const ENTITY_OPTIONS = ["Todos", "produto", "item", "settings"];
const TYPE_OPTIONS = ["Todos", "create", "update", "delete"];

const PERIOD_OPTIONS: { label: string; value: PeriodFilter | "recentes" }[] = [
  { label: "Recentes", value: "recentes" },
  { label: "30 dias",  value: "30d" },
  { label: "3 meses",  value: "3m" },
  { label: "6 meses",  value: "6m" },
  { label: "1 ano",    value: "1y" },
];

const PAGE_SIZE = 10;

export default function AuditList({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [entityFilter, setEntityFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [period, setPeriod] = useState<PeriodFilter | "recentes">("recentes");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [serverHasMore, setServerHasMore] = useState(initialLogs.length === 100);

  const filtered = logs.filter((log) => {
    const entityOk = entityFilter === "Todos" || log.entity === entityFilter;
    const typeOk = typeFilter === "Todos" || log.action.endsWith(`.${typeFilter}`);
    return entityOk && typeOk;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMoreVisible = visibleCount < filtered.length;
  const hasMoreServer = serverHasMore && visibleCount >= filtered.length && period === "recentes";

  async function handlePeriodChange(value: PeriodFilter | "recentes") {
    setPeriod(value);
    setVisibleCount(PAGE_SIZE);

    if (value === "recentes") {
      setLogs(initialLogs);
      setServerHasMore(initialLogs.length === 100);
      return;
    }

    setLoadingPeriod(true);
    const result = await loadAuditLogsByPeriod(value);
    setLogs(result);
    setServerHasMore(false);
    setLoadingPeriod(false);
  }

  async function handleShowMore() {
    if (hasMoreVisible) {
      setVisibleCount((v) => v + PAGE_SIZE);
      return;
    }

    const last = logs[logs.length - 1];
    if (!last) return;
    setLoadingMore(true);
    const more = await loadMoreAuditLogs(last.id);
    if (more.length < 50) setServerHasMore(false);
    setLogs((prev) => [...prev, ...more]);
    setVisibleCount((v) => v + PAGE_SIZE);
    setLoadingMore(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros de período */}
      <div className="flex gap-1.5 flex-wrap">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            disabled={loadingPeriod}
            className={`px-3 py-1.5 text-xs rounded-lg border transition disabled:opacity-40 ${
              period === opt.value
                ? "bg-[#b8944a] border-[#b8944a] text-black font-semibold"
                : "bg-transparent border-[#2d2d2d] text-gray-400 hover:border-[#b8944a] hover:text-[#b8944a]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filtros de entidade e tipo */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Entidade</span>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
            className="bg-[#111] border border-[#2d2d2d] text-[#F5E6C8] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#b8944a] transition"
          >
            {ENTITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Tipo</span>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
            className="bg-[#111] border border-[#2d2d2d] text-[#F5E6C8] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#b8944a] transition"
          >
            {TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <span className="text-xs text-gray-600 ml-auto">
          {loadingPeriod ? "Carregando..." : `${filtered.length} ${filtered.length === 1 ? "registro" : "registros"}`}
        </span>
      </div>

      {loadingPeriod ? (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg px-5 py-8 text-center text-gray-500 text-sm">
          Carregando registros...
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhum registro encontrado.</p>
      ) : (
        <div className="bg-[#111] border border-[#2d2d2d] rounded-lg divide-y divide-[#1a1a1a]">
          {visible.map((log) => (
            <AuditLogRow key={log.id} log={log} />
          ))}
        </div>
      )}

      {!loadingPeriod && (hasMoreVisible || hasMoreServer) && (
        <button
          onClick={handleShowMore}
          disabled={loadingMore}
          className="self-center px-5 py-2 text-sm border border-[#2d2d2d] text-gray-400 rounded-lg hover:border-[#b8944a] hover:text-[#b8944a] transition disabled:opacity-40"
        >
          {loadingMore ? "Carregando..." : `Ver mais ${PAGE_SIZE}`}
        </button>
      )}
    </div>
  );
}
