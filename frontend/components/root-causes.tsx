import type { RootCause } from "@/lib/api";
import { formatTRY } from "@/lib/format";

export default function RootCauses({ causes }: { causes: RootCause[] }) {
  const filtered = (causes ?? []).filter((c) => c.totalLoss !== 0);

  return (
    <section className="flex flex-col rounded-xl border border-white/5 bg-[#11141b] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
      <header className="flex items-baseline justify-between border-b border-white/5 px-6 py-3.5">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
          Kök Neden Detayı
        </h3>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 tabular-nums">
          {filtered.length} kalem
        </span>
      </header>

      {filtered.length === 0 ? (
        <div className="m-6 rounded-md border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-[11px] uppercase tracking-[0.14em] text-zinc-400">
          Veri yok
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {filtered.map((c, idx) => {
            const pct = Math.max(
              0,
              Math.min(100, Math.round(c.percentage)),
            );
            return (
              <li
                key={`${c.type}-${idx}`}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-white/[0.02]"
              >
                <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1">
                  <div className="flex items-baseline gap-2 truncate">
                    <span className="truncate text-[14px] font-medium text-zinc-50">
                      {c.label}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-zinc-400">
                      %{pct}
                    </span>
                  </div>
                  <span className="text-[15px] font-semibold tabular-nums tracking-[-0.01em] text-red-300">
                    {formatTRY(c.totalLoss)}
                  </span>
                  <div className="col-span-2 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full bg-violet-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {c.examples && c.examples.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                      örnek satırlar:
                    </span>
                    {c.examples.slice(0, 3).map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.02] px-2 py-0.5 font-mono text-[11px] tabular-nums text-zinc-300"
                        title={id}
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
