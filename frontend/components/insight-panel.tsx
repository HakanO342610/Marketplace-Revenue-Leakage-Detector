import type { Insights, TopDriver } from "@/lib/api";
import RiskPill from "@/components/risk-pill";
import {
  formatConfidence,
  formatPercent,
  formatTRY,
  issueLabel,
} from "@/lib/format";

type CategoryShareLite = {
  category: string;
  leakage: number;
  share: number;
};

type MarketplaceShareLite = {
  marketplace: string;
  leakage: number;
  share: number;
};

type Props = {
  insights: Insights;
  totalLeakage: number;
  leakageRate: number;
  issueCount: number;
  confidenceScore: number;
  topCategory?: CategoryShareLite;
  topMarketplace?: MarketplaceShareLite;
};

const DRIVER_COLOR: Record<string, string> = {
  MISSING_REFUND: "#ef4444",
  UNDERPAYMENT: "#f59e0b",
  COMMISSION_MISMATCH: "#0ea5e9",
};

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function InsightPanel({
  insights,
  totalLeakage,
  leakageRate,
  issueCount,
  confidenceScore,
  topCategory,
  topMarketplace,
}: Props) {
  const { bullets, alert, risk_level, top_drivers } = insights;
  const topDriver = top_drivers?.[0];
  const driverName = topDriver ? topDriver.label : "—";

  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
          />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Yönetici Özeti
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            otomatik analiz
          </span>
          {risk_level && <RiskPill level={risk_level} />}
        </div>
      </header>

      {/* Zone B — Hero + Donut */}
      <div className="relative grid grid-cols-1 gap-8 px-6 py-9 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-10 md:px-10 md:py-12">
        {/* Decorative red blob */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-red-400/[0.08] blur-3xl"
        />
        {/* Decorative emerald blob */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-20 -bottom-24 h-80 w-80 rounded-full bg-emerald-400/[0.10] blur-3xl"
        />

        {/* LEFT */}
        <div className="relative flex flex-col gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Toplam Gelir Kaybı
          </span>
          <div
            className="text-[44px] font-bold tabular-nums leading-[0.95] tracking-[-0.04em] text-red-600 sm:text-[56px] lg:text-[72px]"
            style={{ textShadow: "0 0 32px rgba(220, 38, 38, 0.18)" }}
          >
            {formatTRY(totalLeakage)}
          </div>
          <p className="text-[14px] text-slate-700 sm:text-[15px]">
            Gelirin{" "}
            <span className="font-semibold text-slate-900 tabular-nums">
              {formatPercent(leakageRate)}
            </span>
            <span className="text-slate-400"> · </span>
            <span className="tabular-nums">{issueCount}</span> sorun
          </p>
          {topDriver && (
            <p
              className="max-w-md text-[16px] leading-snug text-slate-900 sm:text-[18px]"
              style={{ fontFeatureSettings: '"ss01"' }}
            >
              Kaybın{" "}
              <span className="font-semibold tabular-nums text-red-600">
                %{(topDriver.share * 100).toFixed(1)}
              </span>
              {"'ı "}
              <span
                className="font-serif italic font-medium"
                style={{ fontFamily: "ui-serif, Georgia, serif" }}
              >
                {driverName}
              </span>{" "}
              kaynaklı.
            </p>
          )}
        </div>

        {/* RIGHT — Donut + legend */}
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative h-[180px] w-[180px] shrink-0 sm:h-[200px] sm:w-[200px]">
            <DonutSvg drivers={top_drivers ?? []} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                En Büyük Pay
              </span>
              <span className="mt-1 text-[28px] font-bold tabular-nums tracking-[-0.02em] text-slate-900 sm:text-[32px]">
                {topDriver
                  ? `%${(topDriver.share * 100).toFixed(0)}`
                  : "—"}
              </span>
              {topDriver && (
                <span className="mt-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate-500">
                  {topDriver.label}
                </span>
              )}
            </div>
          </div>

          {/* Legend */}
          <ul className="flex w-full flex-col gap-2.5 sm:w-auto sm:min-w-[180px]">
            {(top_drivers ?? []).slice(0, 3).map((d) => (
              <LegendRow key={d.type} driver={d} />
            ))}
          </ul>
        </div>
      </div>

      {/* Zone C — Stats strip */}
      <div className="grid grid-cols-1 border-t border-slate-200 md:grid-cols-3 md:divide-x md:divide-slate-200">
        <StatTile
          label="En Kayıplı Kategori"
          value={topCategory?.category ?? "—"}
          amount={topCategory ? formatTRY(topCategory.leakage) : ""}
          share={topCategory?.share ?? 0}
          tone="emerald"
        />
        <StatTile
          label="En Kayıplı Pazaryeri"
          value={topMarketplace?.marketplace ?? "—"}
          amount={topMarketplace ? formatTRY(topMarketplace.leakage) : ""}
          share={topMarketplace?.share ?? 0}
          tone="emerald"
        />
        <StatTile
          label="Ortalama Güven"
          value={formatConfidence(confidenceScore)}
          valueClass="text-emerald-700"
          amount="kuralların güveni"
          share={confidenceScore}
          tone="emerald"
        />
      </div>

      {/* Optional: keep secondary bullets if any */}
      {bullets && bullets.length > 0 && (
        <div className="border-t border-slate-200 px-6 py-4 md:px-10">
          <ul className="flex flex-col gap-2">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[13px] leading-relaxed text-slate-600"
              >
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1 w-1 rounded-full bg-emerald-500/70"
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Zone D — Alert */}
      {alert && (
        <div
          role="alert"
          className={`relative flex items-start gap-3 border-t px-6 py-3.5 text-[13px] md:px-10 ${
            alert.level === "critical"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <span
            aria-hidden
            className={`absolute left-0 top-0 bottom-0 w-[3px] ${
              alert.level === "critical" ? "bg-red-500" : "bg-amber-500"
            }`}
          />
          <span
            className={`mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
              alert.level === "critical"
                ? "border-red-200 bg-red-100 text-red-700"
                : "border-amber-200 bg-amber-100 text-amber-700"
            }`}
          >
            {alert.level === "critical" ? "Kritik" : "Uyarı"}
          </span>
          <span className="leading-relaxed">{alert.message}</span>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------- Donut ---------------------------------- */

function DonutSvg({ drivers }: { drivers: TopDriver[] }) {
  const segments = drivers.slice(0, 3);

  let cumulative = 0;
  const arcs = segments.map((d) => {
    const offset = -cumulative * CIRCUMFERENCE;
    const length = d.share * CIRCUMFERENCE;
    cumulative += d.share;
    return { type: d.type, offset, length };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full"
      role="img"
      aria-label="Sorun türü dağılımı"
    >
      {/* Decorative outer ring (slow rotation, pure CSS) */}
      <g
        className="origin-center"
        style={{
          animation: "mrld-spin-slow 60s linear infinite",
          transformOrigin: "50px 50px",
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="#10b981"
          strokeOpacity="0.18"
          strokeWidth="0.6"
          strokeDasharray="2 4"
        />
        <circle
          cx="50"
          cy="50"
          r="46.5"
          fill="none"
          stroke="#10b981"
          strokeOpacity="0.10"
          strokeWidth="0.4"
        />
      </g>

      {/* Track */}
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth="14"
      />

      {/* Segments */}
      <g transform="rotate(-90 50 50)">
        {arcs.map((a) => (
          <circle
            key={a.type}
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={DRIVER_COLOR[a.type] ?? "#94a3b8"}
            strokeWidth="14"
            strokeDasharray={`${a.length} ${CIRCUMFERENCE}`}
            strokeDashoffset={a.offset}
            strokeLinecap="butt"
          />
        ))}
      </g>

      {/* Inner ring for depth */}
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="0.5"
      />

      <style>{`
        @keyframes mrld-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}

function LegendRow({ driver }: { driver: TopDriver }) {
  const color = DRIVER_COLOR[driver.type] ?? "#94a3b8";
  return (
    <li className="flex items-center justify-between gap-3 text-[12.5px]">
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-slate-800">
          {issueLabel(driver.type)}
        </span>
      </div>
      <div className="flex items-baseline gap-2 tabular-nums">
        <span className="font-mono text-[11px] text-slate-500">
          %{(driver.share * 100).toFixed(0)}
        </span>
        <span className="font-semibold text-slate-900">
          {formatTRY(driver.amount)}
        </span>
      </div>
    </li>
  );
}

/* --------------------------------- StatTile -------------------------------- */

function StatTile({
  label,
  value,
  valueClass = "text-slate-900",
  amount,
  share,
  tone = "emerald",
}: {
  label: string;
  value: string;
  valueClass?: string;
  amount: string;
  share: number;
  tone?: "emerald" | "red";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(share * 100)));
  const fill = tone === "red" ? "bg-red-500" : "bg-emerald-600";
  return (
    <div className="flex flex-col gap-3 px-6 py-5 md:px-7 md:py-6">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span
        className={`text-[20px] font-semibold tracking-[-0.01em] ${valueClass} sm:text-[22px]`}
      >
        {value}
      </span>
      {amount && (
        <span className="font-mono text-[12px] tabular-nums text-slate-600">
          {amount}
          {share > 0 && share < 1 ? (
            <>
              <span className="text-slate-400"> · </span>
              <span>%{pct}</span>
            </>
          ) : null}
        </span>
      )}
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
