import type { TopDriver } from "@/lib/api";
import { formatTRY } from "@/lib/format";

export default function TopDrivers({ drivers }: { drivers: TopDriver[] }) {
  if (!drivers || drivers.length === 0) return null;

  const top = drivers.slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {top.map((d, i) => {
        const pct = Math.max(0, Math.min(100, Math.round(d.share * 100)));
        const isFirst = i === 0;
        const rank = String(i + 1).padStart(2, "0");
        return (
          <article
            key={`${d.type}-${i}`}
            className={`relative flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm ${
              isFirst
                ? "border border-slate-200 border-l-2 border-l-emerald-600"
                : "border border-slate-200"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400 tabular-nums">
                {rank}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 tabular-nums">
                %{pct}
              </span>
            </div>

            <h3 className="text-[15px] font-medium leading-snug tracking-[-0.01em] text-slate-900">
              {d.label}
            </h3>

            <div
              className={`text-[24px] font-medium tabular-nums leading-none tracking-[-0.02em] ${
                isFirst ? "text-emerald-700" : "text-slate-900"
              }`}
            >
              {formatTRY(d.amount)}
            </div>

            <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${isFirst ? "bg-emerald-600" : "bg-emerald-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
