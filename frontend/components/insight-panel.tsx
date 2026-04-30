import type { Insights } from "@/lib/api";
import RiskPill from "@/components/risk-pill";

export default function InsightPanel({ insights }: { insights: Insights }) {
  const { executive, headline, bullets, alert, risk_level } = insights;
  const display = headline || executive;

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/5 bg-[#11141b] shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-3.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400"
          />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
            Yönetici Özeti
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
            otomatik analiz
          </span>
          {risk_level && <RiskPill level={risk_level} />}
        </div>
      </header>

      <div className="px-6 py-7">
        {display && (
          <div className="relative pl-5">
            <span
              aria-hidden
              className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-violet-400"
            />
            <p
              className="font-serif text-[19px] italic leading-snug tracking-[-0.01em] text-zinc-100 max-w-3xl"
              style={{ fontFamily: "ui-serif, Georgia, serif" }}
            >
              {display}
            </p>
          </div>
        )}

        {bullets && bullets.length > 0 && (
          <ul className="mt-6 flex flex-col gap-2.5 pl-5">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[13.5px] leading-relaxed text-zinc-200"
              >
                <span
                  aria-hidden
                  className="mt-[7px] font-mono text-[10px] text-violet-300/70"
                >
                  ▸
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {alert && (
        <div
          role="alert"
          className={`relative flex items-start gap-3 border-t px-6 py-3.5 text-[13px] ${
            alert.level === "critical"
              ? "border-red-500/20 bg-red-500/[0.06] text-red-200"
              : "border-amber-400/20 bg-amber-400/[0.06] text-amber-200"
          }`}
        >
          <span
            aria-hidden
            className={`absolute left-0 top-0 bottom-0 w-[3px] ${
              alert.level === "critical" ? "bg-red-500" : "bg-amber-400"
            }`}
          />
          <span
            className={`mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
              alert.level === "critical"
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-amber-400/40 bg-amber-400/10 text-amber-300"
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
