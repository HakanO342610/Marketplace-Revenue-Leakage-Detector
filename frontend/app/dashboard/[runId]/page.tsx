import KpiCard from "@/components/kpi-card";
import InsightPanel from "@/components/insight-panel";
import BreakdownBar, {
  type BreakdownItem,
} from "@/components/breakdown-bar";
import InvestigationTable from "@/components/investigation-table";
import ValueMath from "@/components/value-math";
import TopDrivers from "@/components/top-drivers";
import RootCauses from "@/components/root-causes";
import {
  getMyRuns,
  getResults,
  getSummary,
  runReconcile,
  type RunListItem,
} from "@/lib/api";
import {
  formatConfidence,
  formatPercent,
  formatTRY,
  formatTRYShort,
  issueLabel,
} from "@/lib/format";

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateFmt.format(d);
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  let summary = await getSummary(runId);

  if (summary.issue_count === 0 && summary.total_leakage === 0) {
    await runReconcile(runId);
    summary = await getSummary(runId, true);
  }

  const [rows, runs] = await Promise.all([
    getResults(runId, { limit: 100 }),
    safeGetMyRuns(),
  ]);

  const run = runs.find((r) => r.id === runId);

  const truncatedId =
    runId.length > 12 ? `${runId.slice(0, 8)}…${runId.slice(-4)}` : runId;

  // Breakdown bar transformations
  const totalAmountBreakdown =
    summary.amount_breakdown.COMMISSION_MISMATCH +
    summary.amount_breakdown.UNDERPAYMENT +
    summary.amount_breakdown.MISSING_REFUND;

  const amountItems: BreakdownItem[] = (
    [
      "COMMISSION_MISMATCH",
      "UNDERPAYMENT",
      "MISSING_REFUND",
    ] as const
  )
    .map((key) => {
      const amount = summary.amount_breakdown[key] ?? 0;
      const share =
        totalAmountBreakdown > 0 ? amount / totalAmountBreakdown : 0;
      return {
        label: issueLabel(key),
        amount,
        share,
        tone: "danger" as const,
      };
    })
    .filter((it) => it.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const categoryItems: BreakdownItem[] = (summary.category_breakdown ?? [])
    .slice()
    .sort((a, b) => b.leakage - a.leakage)
    .slice(0, 5)
    .map((c) => ({
      label: c.category || "Bilinmeyen",
      amount: c.leakage,
      share: c.share,
      tone: "accent" as const,
    }));

  const marketplaceItems: BreakdownItem[] = (
    summary.marketplace_breakdown ?? []
  )
    .slice()
    .sort((a, b) => b.leakage - a.leakage)
    .map((m) => ({
      label: m.marketplace || "Bilinmeyen",
      amount: m.leakage,
      share: m.share,
      tone: "neutral" as const,
    }));

  const driver = summary.top_loss_driver;
  const driverShare = Math.round((driver?.share ?? 0) * 100);

  return (
    <div className="px-8 py-6">
      <div className="flex flex-col gap-7">
        {/* RUN HEADER */}
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <span
              className="text-[22px] font-medium tracking-[-0.02em] text-slate-900"
              title={run?.filename}
            >
              {run?.filename ?? "Adsız dosya"}
            </span>
            <Sep />
            <MetaItem label="Pazaryeri" value={run?.marketplace ?? "—"} />
            <Sep />
            <MetaItem
              label="Yüklenme"
              value={run ? formatDate(run.createdAt) : "—"}
            />
            <Sep />
            <span
              className="font-mono text-[12px] text-slate-500"
              title={runId}
            >
              <span className="text-slate-400">·</span> run/{truncatedId}
            </span>
          </div>
        </header>

        {/* VALUE MATH — anchors page on value recovered */}
        <ValueMath
          monthly={summary.monthly_recovered}
          annual={summary.annual_impact}
        />

        {/* LAYER 1 — CFO SUMMARY */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <SectionLabel>Layer 01 — CFO Özeti</SectionLabel>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
              tüm değerler ₺
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard
              title="Beklenen Gelir"
              value={formatTRY(summary.expected_revenue)}
              tone="subtle"
            />
            <KpiCard
              title="Toplam Gelir"
              value={formatTRY(summary.total_revenue)}
              tone="neutral"
            />
            <KpiCard
              title="Toplam Ödenen"
              value={formatTRY(summary.total_paid)}
              tone="neutral"
            />
            <KpiCard
              title="Toplam Kayıp"
              value={formatTRY(summary.total_leakage)}
              tone="danger"
              delta={`${formatPercent(summary.leakage_rate)} oran`}
              subtitle={`${summary.issue_count} sorun`}
            />
            <KpiCard
              title="Açıklanmayan Fark"
              value={formatTRY(summary.unexplained_variance)}
              tone="subtle"
            />
            <KpiCard
              title="Güven Skoru"
              value={formatConfidence(summary.confidence_score)}
              tone="positive"
            />
          </div>

          {driver && driver.amount > 0 && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-slate-600">
              <span className="font-mono uppercase tracking-[0.14em] text-slate-500">
                en çok kayıp veren
              </span>
              <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.10em] text-red-700">
                {issueLabel(driver.type)}
              </span>
              <span className="tabular-nums text-slate-700">%{driverShare}</span>
              <span className="text-slate-400">·</span>
              <span className="tabular-nums font-semibold text-red-600">
                {formatTRY(driver.amount)}
              </span>
            </p>
          )}
        </section>

        {/* INSIGHT PANEL */}
        {summary.insights && (
          <section className="flex flex-col gap-3">
            <SectionLabel>Layer 02 — Yönetici İçgörüsü</SectionLabel>
            <InsightPanel insights={summary.insights} />
          </section>
        )}

        {/* LAYER 3 — KÖK NEDEN (Top drivers + Root cause detail + Breakdowns) */}
        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <SectionLabel>Layer 03 — Kök Neden</SectionLabel>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
              kayıp kaynakları
            </span>
          </div>

          {summary.insights?.top_drivers &&
            summary.insights.top_drivers.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    En Yüksek 3 Kayıp Kaynağı
                  </h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 tabular-nums">
                    {Math.min(3, summary.insights.top_drivers.length)} kalem
                  </span>
                </div>
                <TopDrivers drivers={summary.insights.top_drivers} />
              </div>
            )}

          {summary.root_causes && summary.root_causes.length > 0 && (
            <RootCauses causes={summary.root_causes} />
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Dağılım
              </h3>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                kısa formatlı tutarlar
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <BreakdownBar
                title="Sorun Türüne Göre"
                items={amountItems}
                formatAmount={formatTRYShort}
                accent="danger"
              />
              <BreakdownBar
                title="Kategori"
                items={categoryItems}
                formatAmount={formatTRYShort}
                accent="accent"
                hint="ilk 5 kalem"
              />
              <BreakdownBar
                title="Pazaryeri"
                items={marketplaceItems}
                formatAmount={formatTRYShort}
                accent="neutral"
              />
            </div>
          </div>
        </section>

        {/* LAYER 4 — INVESTIGATION */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <SectionLabel>Layer 04 — Sorun İncelemesi</SectionLabel>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
              ilk 100 satır
            </span>
          </div>
          <InvestigationTable runId={runId} rows={rows} />
        </section>
      </div>
    </div>
  );
}

async function safeGetMyRuns(): Promise<RunListItem[]> {
  try {
    return await getMyRuns();
  } catch {
    return [];
  }
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="text-[13.5px] text-slate-700">{value}</span>
    </span>
  );
}

function Sep() {
  return (
    <span aria-hidden className="text-slate-300">
      ·
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
      {children}
    </h2>
  );
}
