"use client";

import { useMemo, useState } from "react";
import {
  getAttributions,
  type AttributionRow,
  type AttributionSeverity,
  type ResultRow,
} from "@/lib/api";
import { formatTRY, issueLabel, severityRank } from "@/lib/format";
import AttributionDetail from "@/components/attribution-detail";

type IssueCode = "COMMISSION_MISMATCH" | "UNDERPAYMENT" | "MISSING_REFUND";
type TabKey = "all" | IssueCode;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "COMMISSION_MISMATCH", label: "Komisyon Farkı" },
  { key: "UNDERPAYMENT", label: "Eksik Ödeme" },
  { key: "MISSING_REFUND", label: "Eksik İade" },
];

const COL_COUNT = 7;

type AttributionState =
  | { status: "loading" }
  | { status: "ready"; data: AttributionRow[] }
  | { status: "error"; message: string };

export default function InvestigationTable({
  runId,
  rows,
}: {
  runId: string;
  rows: ResultRow[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, AttributionState>>({});

  const counts = useMemo(() => {
    const c = {
      all: rows.filter((r) => r.issues && r.issues.length > 0).length,
      COMMISSION_MISMATCH: 0,
      UNDERPAYMENT: 0,
      MISSING_REFUND: 0,
    } as Record<TabKey, number>;
    for (const r of rows) {
      for (const i of r.issues ?? []) {
        if (i in c) c[i as IssueCode] += 1;
      }
    }
    return c;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const withIssues = rows.filter((r) => r.issues && r.issues.length > 0);
    if (activeTab === "all") return withIssues;
    return withIssues.filter((r) => r.issues.includes(activeTab));
  }, [rows, activeTab]);

  async function toggleExpand(orderLineId: string) {
    if (expandedId === orderLineId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderLineId);
    if (cache[orderLineId]?.status === "ready") return;
    setCache((prev) => ({ ...prev, [orderLineId]: { status: "loading" } }));
    try {
      const data = await getAttributions(runId, orderLineId);
      setCache((prev) => ({
        ...prev,
        [orderLineId]: { status: "ready", data },
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Detaylar alınamadı.";
      setCache((prev) => ({
        ...prev,
        [orderLineId]: { status: "error", message },
      }));
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* TAB STRIP */}
      <div className="flex flex-wrap items-center gap-0 border-b border-slate-200 px-3">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`group relative inline-flex items-center gap-2 px-3.5 py-3 text-[13px] font-medium transition-colors ${
                active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                }`}
              >
                {count}
              </span>
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-2 -bottom-px h-[2px] bg-emerald-600"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-200">
              <Th>Sipariş Satır No</Th>
              <Th>Sorun</Th>
              <Th align="right">Beklenen</Th>
              <Th align="right">Gerçekleşen</Th>
              <Th align="right">Fark</Th>
              <Th align="right">Tahmini Kayıp</Th>
              <Th align="right">Detay</Th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={COL_COUNT}
                  className="px-4 py-12 text-center text-[12px] uppercase tracking-[0.14em] text-slate-500"
                >
                  Bu filtrede gösterilecek satır yok
                </td>
              </tr>
            )}
            {visibleRows.map((row) => {
              const variance = row.expectedAmount - row.actualAmount;
              const isOpen = expandedId === row.orderLineId;
              const state = cache[row.orderLineId];
              const sev = highestSeverityFromState(state);
              return (
                <RowFragment
                  key={row.orderLineId}
                  row={row}
                  variance={variance}
                  isOpen={isOpen}
                  state={state}
                  severity={sev}
                  onToggle={() => toggleExpand(row.orderLineId)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function highestSeverityFromState(
  state: AttributionState | undefined,
): AttributionSeverity | null {
  if (!state || state.status !== "ready") return null;
  let best: AttributionSeverity | null = null;
  for (const a of state.data) {
    if (!best || severityRank(a.severity) > severityRank(best)) {
      best = a.severity;
    }
  }
  return best;
}

function severityBorderClass(s: AttributionSeverity | null): string {
  if (s === "critical") return "shadow-[inset_2px_0_0_0_#ef4444]";
  if (s === "warning") return "shadow-[inset_2px_0_0_0_#f59e0b]";
  if (s === "info") return "shadow-[inset_2px_0_0_0_#0ea5e9]";
  return "shadow-[inset_2px_0_0_0_#cbd5e1]";
}

function RowFragment({
  row,
  variance,
  isOpen,
  state,
  severity,
  onToggle,
}: {
  row: ResultRow;
  variance: number;
  isOpen: boolean;
  state: AttributionState | undefined;
  severity: AttributionSeverity | null;
  onToggle: () => void;
}) {
  const varianceClass =
    variance < 0
      ? "text-red-600"
      : variance > 0
        ? "text-slate-700"
        : "text-slate-400";

  // Severity-tinted left border. Defaults to a soft red because rows here
  // already carry confirmed leakage by definition (filter on row.issues).
  const fallback: AttributionSeverity | null =
    row.issues.length > 0 ? "critical" : null;
  const effectiveSev = severity ?? fallback;
  const borderClass = severityBorderClass(effectiveSev);

  return (
    <>
      <tr
        className={`border-b border-slate-200 transition-colors ${borderClass} ${
          isOpen ? "bg-emerald-50/30" : "hover:bg-slate-50"
        }`}
      >
        <Td>
          <span className="font-mono text-[12px] text-slate-700">
            <span className="text-slate-400">·</span> {row.orderLineId}
          </span>
        </Td>
        <Td>
          <div className="flex flex-wrap gap-1.5">
            {row.issues.map((issue) => (
              <span
                key={issue}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-emerald-700"
              >
                {issueLabel(issue)}
              </span>
            ))}
          </div>
        </Td>
        <Td align="right">
          <span className="tabular-nums text-slate-700">
            {formatTRY(row.expectedAmount)}
          </span>
        </Td>
        <Td align="right">
          <span className="tabular-nums text-slate-700">
            {formatTRY(row.actualAmount)}
          </span>
        </Td>
        <Td align="right">
          <span className={`tabular-nums ${varianceClass}`}>
            {formatTRY(variance)}
          </span>
        </Td>
        <Td align="right">
          <span className="font-semibold tabular-nums text-red-600">
            {formatTRY(row.estimatedLoss)}
          </span>
        </Td>
        <Td align="right">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="uppercase tracking-[0.10em]">
              {isOpen ? "Kapat" : "Aç"}
            </span>
            <span aria-hidden className="text-slate-400">
              {isOpen ? "▾" : "▸"}
            </span>
          </button>
        </Td>
      </tr>
      {isOpen && (
        <tr className="bg-slate-50">
          <td colSpan={COL_COUNT} className="px-4 py-4">
            {!state || state.status === "loading" ? (
              <SkeletonRow />
            ) : state.status === "error" ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {state.message}
              </div>
            ) : (
              <AttributionDetail attributions={state.data} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-14 animate-pulse rounded-md bg-slate-200/60" />
      <div className="h-14 animate-pulse rounded-md bg-slate-200/40" />
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const alignClass = align === "right" ? "text-right" : "text-left";
  return (
    <th
      scope="col"
      className={`px-4 py-3 ${alignClass} text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const alignClass = align === "right" ? "text-right" : "text-left";
  return (
    <td className={`px-4 py-2.5 ${alignClass} align-middle`}>{children}</td>
  );
}
