import { formatTRY } from "@/lib/format";

export default function ValueMath({
  monthly,
  annual,
}: {
  monthly: number;
  annual: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1px_1fr]">
        {/* LEFT — monthly recovered (emerald) */}
        <div className="relative px-7 py-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/[0.18] blur-3xl"
          />
          <div className="relative">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Aylık Kurtarılabilir Gelir
            </div>
            <div
              className="mt-2 font-medium tabular-nums leading-none tracking-[-0.025em] text-emerald-700 text-[44px] sm:text-[52px]"
              style={{ textShadow: "0 0 28px rgba(16,185,129,0.20)" }}
            >
              {formatTRY(monthly)}
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
              bu çalıştırmada tespit edilen
            </div>
          </div>
        </div>

        {/* SEPARATOR */}
        <div
          aria-hidden
          className="hidden sm:block bg-slate-200"
        />
        <div
          aria-hidden
          className="block sm:hidden h-px w-full bg-slate-200"
        />

        {/* RIGHT — annual impact (red, loss-side) */}
        <div className="relative px-7 py-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-400/[0.14] blur-3xl"
          />
          <div className="relative">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Yıllık Etki
            </div>
            <div
              className="mt-2 font-medium tabular-nums leading-none tracking-[-0.025em] text-red-600 text-[44px] sm:text-[52px]"
              style={{ textShadow: "0 0 28px rgba(220,38,38,0.18)" }}
            >
              {formatTRY(annual)}
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
              12 × aylık projeksiyon
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-7 py-3">
        <p className="text-[12px] tracking-tight text-slate-500">
          Bu çalıştırma ~1 aylık veri varsayımıyla yıllık projeksiyon.
        </p>
      </div>
    </section>
  );
}
