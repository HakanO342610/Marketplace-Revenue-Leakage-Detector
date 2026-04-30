import type { AttributionSeverity } from "@/lib/api";

export function formatTRY(n: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPercent(n: number): string {
  return n.toFixed(2) + "%";
}

const compactFmt = new Intl.NumberFormat("tr-TR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatTRYShort(n: number): string {
  return compactFmt.format(n) + " ₺";
}

export function formatConfidence(n: number): string {
  return (n * 100).toFixed(0) + "%";
}

export const ISSUE_LABELS_TR: Record<string, string> = {
  COMMISSION_MISMATCH: "Komisyon Farkı",
  UNDERPAYMENT: "Eksik Ödeme",
  MISSING_REFUND: "Eksik İade",
};

export function issueLabel(code: string): string {
  return ISSUE_LABELS_TR[code] ?? code;
}

export type SeverityClassSet = {
  bg: string;
  text: string;
  border: string;
  ring: string;
  accent: string;
};

export function severityClasses(s: AttributionSeverity): SeverityClassSet {
  if (s === "critical") {
    return {
      bg: "bg-red-500/10",
      text: "text-red-300",
      border: "border-red-500/30",
      ring: "ring-red-500/20",
      accent: "bg-red-500",
    };
  }
  if (s === "warning") {
    return {
      bg: "bg-amber-400/10",
      text: "text-amber-300",
      border: "border-amber-400/30",
      ring: "ring-amber-400/20",
      accent: "bg-amber-400",
    };
  }
  return {
    bg: "bg-indigo-500/10",
    text: "text-indigo-300",
    border: "border-indigo-500/30",
    ring: "ring-indigo-500/20",
    accent: "bg-indigo-400",
  };
}

export function severityRank(s: AttributionSeverity): number {
  if (s === "critical") return 3;
  if (s === "warning") return 2;
  return 1;
}
