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
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      ring: "ring-red-200",
      accent: "bg-red-500",
    };
  }
  if (s === "warning") {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      ring: "ring-amber-200",
      accent: "bg-amber-500",
    };
  }
  return {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    ring: "ring-sky-200",
    accent: "bg-sky-500",
  };
}

export function severityRank(s: AttributionSeverity): number {
  if (s === "critical") return 3;
  if (s === "warning") return 2;
  return 1;
}
