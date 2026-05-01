type BreakdownTone = "neutral" | "danger" | "accent";

export type BreakdownItem = {
  label: string;
  amount: number;
  share: number;
  tone?: BreakdownTone;
};

export default function BreakdownBar({
  title,
  items,
  formatAmount,
  accent = "neutral",
  hint,
}: {
  title: string;
  items: BreakdownItem[];
  formatAmount: (n: number) => string;
  accent?: BreakdownTone;
  hint?: string;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          {title}
        </h3>
        <span className="font-mono text-[11px] tabular-nums text-slate-500">
          {items.length > 0 ? `${items.length} kalem` : "0 kalem"}
        </span>
      </header>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-[11px] uppercase tracking-[0.14em] text-slate-500">
          Veri yok
        </div>
      ) : (
        <ul className="flex flex-col">
          {items.map((it, i) => {
            const pct = Math.max(
              0,
              Math.min(100, Math.round(it.share * 100)),
            );
            const tone = it.tone ?? accent;
            const fillClass =
              tone === "danger"
                ? "bg-red-500"
                : tone === "accent"
                  ? "bg-emerald-600"
                  : "bg-slate-700";
            const amountClass =
              tone === "danger"
                ? "text-red-600"
                : tone === "accent"
                  ? "text-emerald-700"
                  : "text-slate-900";
            return (
              <li
                key={`${it.label}-${i}`}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 rounded-md px-1 py-2 transition-colors hover:bg-slate-50"
              >
                <span
                  className="truncate text-[13px] font-medium text-slate-800"
                  title={it.label}
                >
                  {it.label}
                </span>
                <span className="flex items-baseline gap-3 text-[12px] tabular-nums">
                  <span className="font-mono text-[11px] text-slate-500">
                    %{pct}
                  </span>
                  <span
                    className={`font-semibold tracking-[-0.01em] ${amountClass}`}
                  >
                    {formatAmount(it.amount)}
                  </span>
                </span>
                <div className="col-span-2 h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${fillClass} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hint && (
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
          {hint}
        </p>
      )}
    </section>
  );
}
