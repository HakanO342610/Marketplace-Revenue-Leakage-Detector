type Tone = "neutral" | "danger" | "positive" | "subtle";

export default function KpiCard({
  title,
  value,
  subtitle,
  tone = "neutral",
  delta,
}: {
  title: string;
  value: string;
  subtitle?: string;
  tone?: Tone;
  delta?: string;
}) {
  const valueClass: Record<Tone, string> = {
    neutral: "text-slate-900",
    danger: "text-red-600",
    positive: "text-emerald-700",
    subtle: "text-slate-500",
  };

  const deltaClass: Record<Tone, string> = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
    subtle: "border-slate-200 bg-slate-50 text-slate-500",
  };

  const sizeClass = tone === "subtle" ? "text-[22px]" : "text-[26px]";

  const dangerInset =
    tone === "danger"
      ? "shadow-[0_0_0_1px_rgba(220,38,38,0.10)] border-red-200"
      : "border-slate-200";

  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-colors hover:border-slate-300 ${dangerInset}`}
    >
      {tone === "danger" && (
        <span
          aria-hidden
          className="absolute left-0 top-3 bottom-3 w-px bg-gradient-to-b from-transparent via-red-400/60 to-transparent"
        />
      )}
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {title}
      </div>
      <div
        className={`mt-2 font-medium tabular-nums leading-none tracking-[-0.02em] ${sizeClass} ${valueClass[tone]}`}
      >
        {value}
      </div>
      <div className="mt-2 flex min-h-[18px] items-center gap-2">
        {delta && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.10em] tabular-nums ${deltaClass[tone]}`}
          >
            {delta}
          </span>
        )}
        {subtitle && (
          <span className="text-[11px] tabular-nums text-slate-500">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
