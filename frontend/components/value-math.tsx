import { formatTRY } from "@/lib/format";

export default function ValueMath({
  monthly,
  annual,
}: {
  monthly: number;
  annual: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-white/5 bg-[#1a1e27] shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1px_1fr]">
        {/* LEFT — monthly recovered (violet) */}
        <div className="relative px-7 py-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-violet-500/[0.10] blur-3xl"
          />
          <div className="relative">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
              Aylık Kurtarılabilir Gelir
            </div>
            <div
              className="mt-2 font-medium tabular-nums leading-none tracking-[-0.025em] text-violet-300 text-[44px] sm:text-[52px]"
              style={{ textShadow: "0 0 28px rgba(167,139,250,0.25)" }}
            >
              {formatTRY(monthly)}
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
              bu çalıştırmada tespit edilen
            </div>
          </div>
        </div>

        {/* SEPARATOR */}
        <div
          aria-hidden
          className="hidden sm:block bg-gradient-to-b from-transparent via-white/10 to-transparent"
        />
        <div
          aria-hidden
          className="block sm:hidden h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />

        {/* RIGHT — annual impact (red, loss-side) */}
        <div className="relative px-7 py-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-500/[0.08] blur-3xl"
          />
          <div className="relative">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
              Yıllık Etki
            </div>
            <div
              className="mt-2 font-medium tabular-nums leading-none tracking-[-0.025em] text-red-300 text-[44px] sm:text-[52px]"
              style={{ textShadow: "0 0 28px rgba(252,165,165,0.20)" }}
            >
              {formatTRY(annual)}
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
              12 × aylık projeksiyon
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-7 py-3">
        <p className="text-[12px] tracking-tight text-zinc-400">
          Bu çalıştırma ~1 aylık veri varsayımıyla yıllık projeksiyon.
        </p>
      </div>
    </section>
  );
}
