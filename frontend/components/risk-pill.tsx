import type { RiskLevel } from "@/lib/api";

const LABELS: Record<RiskLevel, string> = {
  HIGH: "YÜKSEK",
  MEDIUM: "ORTA",
  LOW: "DÜŞÜK",
};

const TONE: Record<RiskLevel, string> = {
  HIGH: "border-red-200 bg-red-50 text-red-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function RiskPill({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] tabular-nums ${TONE[level]}`}
    >
      RİSK · {LABELS[level]}
    </span>
  );
}
