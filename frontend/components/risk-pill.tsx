import type { RiskLevel } from "@/lib/api";

const LABELS: Record<RiskLevel, string> = {
  HIGH: "YÜKSEK",
  MEDIUM: "ORTA",
  LOW: "DÜŞÜK",
};

const TONE: Record<RiskLevel, string> = {
  HIGH: "border-red-500/30 bg-red-500/10 text-red-300",
  MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  LOW: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
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
