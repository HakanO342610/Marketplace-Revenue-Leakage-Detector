import { Injectable } from '@nestjs/common';

export interface BreakdownEntry {
  category: string;
  leakage: number;
  share: number;
}

export interface MarketplaceEntry {
  marketplace: string;
  leakage: number;
  share: number;
}

export interface AmountBreakdown {
  COMMISSION_MISMATCH: number;
  UNDERPAYMENT: number;
  MISSING_REFUND: number;
}

export interface TopLossDriver {
  type: string;
  amount: number;
  share: number;
}

export interface InsightAlert {
  level: 'critical' | 'warning';
  message: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface InsightDriver {
  type: string;
  label: string;
  amount: number;
  share: number;
}

export interface InsightsResult {
  executive: string;
  bullets: string[];
  alert: InsightAlert | null;
  risk_level: RiskLevel;
  headline: string;
  top_drivers: InsightDriver[];
}

export interface InsightsInput {
  total_revenue: number;
  total_leakage: number;
  leakage_rate: number;
  unexplained_variance: number;
  confidence_score: number;
  issue_count: number;
  top_loss_driver: TopLossDriver;
  amount_breakdown: AmountBreakdown;
  category_breakdown: BreakdownEntry[];
  marketplace_breakdown: MarketplaceEntry[];
}

const ISSUE_LABELS_TR: Record<string, string> = {
  COMMISSION_MISMATCH: 'Komisyon Farkı',
  UNDERPAYMENT: 'Eksik Ödeme',
  MISSING_REFUND: 'Eksik İade',
};

function formatTRY(n: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n);
}

@Injectable()
export class InsightsService {
  build(input: InsightsInput): InsightsResult {
    const {
      total_leakage,
      leakage_rate,
      unexplained_variance,
      confidence_score,
      issue_count,
      top_loss_driver,
      category_breakdown,
      marketplace_breakdown,
    } = input;

    const rate = leakage_rate.toFixed(2);
    const topShare = (top_loss_driver.share * 100).toFixed(1);
    const topLabel =
      ISSUE_LABELS_TR[top_loss_driver.type] ?? top_loss_driver.type;

    const executive = `Bu çalıştırmada gelirin %${rate}'i ${formatTRY(total_leakage)} olarak kayboldu — kaybın %${topShare} oranı ${topLabel} kaynaklı.`;

    const bullets: string[] = [];

    if (category_breakdown.length > 0) {
      const top = category_breakdown[0];
      const sharePct = (top.share * 100).toFixed(1);
      bullets.push(
        `${top.category} kategorisi en çok kayıp veriyor: ${formatTRY(top.leakage)} (%${sharePct})`,
      );
    }

    if (marketplace_breakdown.length > 0) {
      const top = marketplace_breakdown[0];
      bullets.push(
        `${top.marketplace} pazaryerinde toplam ${formatTRY(top.leakage)} kayıp tespit edildi`,
      );
    }

    const confidencePct = (confidence_score * 100).toFixed(0);
    bullets.push(
      `${issue_count} sorun tespit edildi, ortalama güven skoru %${confidencePct}`,
    );

    let alert: InsightAlert | null = null;
    if (leakage_rate > 5) {
      alert = {
        level: 'critical',
        message: `Yüksek kayıp oranı: gelirin %${rate}'i kaybediliyor.`,
      };
    } else if (unexplained_variance > 10000) {
      alert = {
        level: 'warning',
        message: `Açıklanmayan ${formatTRY(unexplained_variance)} fark var — kurallar dışı kayıp olabilir.`,
      };
    }

    let risk_level: RiskLevel = 'LOW';
    if (leakage_rate > 5) risk_level = 'HIGH';
    else if (leakage_rate > 2) risk_level = 'MEDIUM';

    const totalAmount =
      input.amount_breakdown.COMMISSION_MISMATCH +
      input.amount_breakdown.UNDERPAYMENT +
      input.amount_breakdown.MISSING_REFUND;

    const top_drivers: InsightDriver[] = (
      ['COMMISSION_MISMATCH', 'UNDERPAYMENT', 'MISSING_REFUND'] as const
    )
      .map((type) => {
        const amount = input.amount_breakdown[type] ?? 0;
        return {
          type,
          label: ISSUE_LABELS_TR[type] ?? type,
          amount: Math.round(amount * 100) / 100,
          share: totalAmount > 0 ? amount / totalAmount : 0,
        };
      })
      .filter((d) => d.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return { executive, bullets, alert, risk_level, headline: executive, top_drivers };
  }
}
