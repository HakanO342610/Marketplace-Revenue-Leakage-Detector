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
            className={`relative flex flex-col gap-3 rounded-lg bg-[#11141b] p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset] ${
              isFirst
                ? "border border-white/5 border-l-2 border-l-violet-500"
                : "border border-white/5"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 tabular-nums">
                {rank}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 tabular-nums">
                %{pct}
              </span>
            </div>

            <h3 className="text-[15px] font-medium leading-snug tracking-[-0.01em] text-zinc-50">
              {d.label}
            </h3>

            <div
              className={`text-[24px] font-medium tabular-nums leading-none tracking-[-0.02em] ${
                isFirst ? "text-violet-200" : "text-zinc-100"
              }`}
            >
              {formatTRY(d.amount)}
            </div>

            <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={`h-full ${isFirst ? "bg-violet-500" : "bg-violet-400/60"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
