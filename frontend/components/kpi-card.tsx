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
    neutral: "text-zinc-50",
    danger: "text-red-400",
    positive: "text-emerald-400",
    subtle: "text-zinc-400",
  };

  const deltaClass: Record<Tone, string> = {
    neutral: "border-white/10 bg-white/[0.03] text-zinc-300",
    danger: "border-red-500/30 bg-red-500/10 text-red-300",
    positive: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    subtle: "border-white/10 bg-white/[0.03] text-zinc-400",
  };

  const sizeClass = tone === "subtle" ? "text-[22px]" : "text-[26px]";

  const dangerInset =
    tone === "danger"
      ? "shadow-[inset_0_1px_0_0_rgba(239,68,68,0.18),inset_1px_0_0_0_rgba(239,68,68,0.10)] border-red-500/20"
      : "border-white/5";

  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-[#11141b] p-5 transition-colors hover:border-white/15 ${dangerInset}`}
    >
      {tone === "danger" && (
        <span
          aria-hidden
          className="absolute left-0 top-3 bottom-3 w-px bg-gradient-to-b from-transparent via-red-500/40 to-transparent"
        />
      )}
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
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
          <span className="text-[11px] tabular-nums text-zinc-400">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
