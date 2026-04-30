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
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#11141b] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
      {/* TAB STRIP */}
      <div className="flex flex-wrap items-center gap-0 border-b border-white/5 px-3">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`group relative inline-flex items-center gap-2 px-3.5 py-3 text-[13px] font-medium transition-colors ${
                active ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                  active
                    ? "bg-violet-500/15 text-violet-200"
                    : "bg-white/[0.04] text-zinc-400 group-hover:bg-white/[0.06]"
                }`}
              >
                {count}
              </span>
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-2 -bottom-px h-[1.5px] bg-violet-400"
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
            <tr className="border-b border-white/5">
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
                  className="px-4 py-12 text-center text-[12px] uppercase tracking-[0.14em] text-zinc-400"
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
  if (s === "warning") return "shadow-[inset_2px_0_0_0_#fbbf24]";
  if (s === "info") return "shadow-[inset_2px_0_0_0_#818cf8]";
  return "shadow-[inset_2px_0_0_0_rgba(255,255,255,0.05)]";
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
      ? "text-red-300"
      : variance > 0
        ? "text-zinc-300"
        : "text-zinc-500";

  // Severity-tinted left border. Defaults to a soft red because rows here
  // already carry confirmed leakage by definition (filter on row.issues).
  const fallback: AttributionSeverity | null =
    row.issues.length > 0 ? "critical" : null;
  const effectiveSev = severity ?? fallback;
  const borderClass = severityBorderClass(effectiveSev);

  return (
    <>
      <tr
        className={`border-b border-white/5 transition-colors ${borderClass} ${
          isOpen ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
        }`}
      >
        <Td>
          <span className="font-mono text-[12px] text-zinc-200">
            <span className="text-zinc-500">·</span> {row.orderLineId}
          </span>
        </Td>
        <Td>
          <div className="flex flex-wrap gap-1.5">
            {row.issues.map((issue) => (
              <span
                key={issue}
                className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-indigo-200"
              >
                {issueLabel(issue)}
              </span>
            ))}
          </div>
        </Td>
        <Td align="right">
          <span className="tabular-nums text-zinc-200">
            {formatTRY(row.expectedAmount)}
          </span>
        </Td>
        <Td align="right">
          <span className="tabular-nums text-zinc-200">
            {formatTRY(row.actualAmount)}
          </span>
        </Td>
        <Td align="right">
          <span className={`tabular-nums ${varianceClass}`}>
            {formatTRY(variance)}
          </span>
        </Td>
        <Td align="right">
          <span className="font-semibold tabular-nums text-red-400">
            {formatTRY(row.estimatedLoss)}
          </span>
        </Td>
        <Td align="right">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-zinc-100"
          >
            <span className="uppercase tracking-[0.10em]">
              {isOpen ? "Kapat" : "Aç"}
            </span>
            <span aria-hidden className="text-zinc-500">
              {isOpen ? "▾" : "▸"}
            </span>
          </button>
        </Td>
      </tr>
      {isOpen && (
        <tr className="bg-[#0e1119]">
          <td colSpan={COL_COUNT} className="px-4 py-4">
            {!state || state.status === "loading" ? (
              <SkeletonRow />
            ) : state.status === "error" ? (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
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
      <div className="h-14 animate-pulse rounded-md bg-white/[0.04]" />
      <div className="h-14 animate-pulse rounded-md bg-white/[0.03]" />
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
      className={`px-4 py-3 ${alignClass} text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400`}
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
