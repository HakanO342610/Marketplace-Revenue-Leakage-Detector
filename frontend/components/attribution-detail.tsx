"use client";

import type { AttributionRow } from "@/lib/api";
import {
  formatConfidence,
  formatTRY,
  issueLabel,
  severityClasses,
} from "@/lib/format";

export default function AttributionDetail({
  attributions,
}: {
  attributions: AttributionRow[];
}) {
  if (!attributions || attributions.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[11px] uppercase tracking-[0.14em] text-slate-500">
        Detay verisi yok (eski çalıştırma)
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {attributions.map((a, idx) => {
        const sev = severityClasses(a.severity);
        const sevLabel =
          a.severity === "critical"
            ? "Kritik"
            : a.severity === "warning"
              ? "Uyarı"
              : "Bilgi";
        const lossClass =
          a.loss > 0
            ? "text-red-600"
            : a.loss < 0
              ? "text-emerald-700"
              : "text-slate-700";
        const varianceClass =
          a.variance < 0
            ? "text-red-600"
            : a.variance > 0
              ? "text-slate-700"
              : "text-slate-400";

        const sevAccent =
          a.severity === "critical"
            ? "before:bg-red-500"
            : a.severity === "warning"
              ? "before:bg-amber-500"
              : "before:bg-sky-500";

        return (
          <div
            key={`${a.ruleName}-${idx}`}
            className={`relative flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 pl-6 shadow-sm lg:flex-row lg:items-start lg:gap-6 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px] before:rounded-full ${sevAccent}`}
          >
            <div className="flex shrink-0 items-start gap-3">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${sev.bg} ${sev.text} ${sev.border}`}
              >
                {sevLabel}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                {issueLabel(a.ruleName)}
              </div>
              <p className="max-w-2xl text-[13.5px] leading-relaxed text-slate-700">
                {a.explanation}
              </p>
            </div>
            <dl className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-2.5 text-right tabular-nums sm:grid-cols-5 lg:gap-x-5">
              <Metric label="Beklenen" value={formatTRY(a.expected)} />
              <Metric label="Gerçekleşen" value={formatTRY(a.actual)} />
              <Metric
                label="Fark"
                value={formatTRY(a.variance)}
                valueClass={varianceClass}
              />
              <Metric
                label="Kayıp"
                value={formatTRY(a.loss)}
                valueClass={`font-semibold ${lossClass}`}
              />
              <div className="flex flex-col items-end gap-1">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  Güven
                </dt>
                <dd>
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] tabular-nums text-emerald-700">
                    {formatConfidence(a.confidence)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function Metric({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className={`text-[12px] tabular-nums ${valueClass}`}>{value}</dd>
    </div>
  );
}
