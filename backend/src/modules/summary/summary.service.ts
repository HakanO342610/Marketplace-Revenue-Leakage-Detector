import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AmountBreakdown,
  BreakdownEntry,
  InsightsResult,
  InsightsService,
  MarketplaceEntry,
  TopLossDriver,
} from './insights.service';

export interface IssueBreakdown {
  COMMISSION_MISMATCH: number;
  UNDERPAYMENT: number;
  MISSING_REFUND: number;
  [key: string]: number;
}

export interface RootCause {
  type: 'COMMISSION_MISMATCH' | 'UNDERPAYMENT' | 'MISSING_REFUND';
  label: string;
  totalLoss: number;
  percentage: number;
  examples: string[];
}

export interface SummaryDto {
  runId: string;
  total_revenue: number;
  total_paid: number;
  total_leakage: number;
  leakage_rate: number;
  leakage_score: number;
  issue_count: number;
  issue_breakdown: IssueBreakdown;
  expected_revenue: number;
  recovered_revenue_potential: number;
  monthly_recovered: number;
  annual_impact: number;
  unexplained_variance: number;
  confidence_score: number;
  top_loss_driver: TopLossDriver;
  amount_breakdown: AmountBreakdown;
  category_breakdown: BreakdownEntry[];
  marketplace_breakdown: MarketplaceEntry[];
  root_causes: RootCause[];
  insights: InsightsResult;
}

const round = (n: number): number => Math.round(n * 100) / 100;

@Injectable()
export class SummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insightsService: InsightsService,
  ) {}

  async get(runId: string, orgId: string): Promise<SummaryDto> {
    const run = await this.prisma.uploadRun.findFirst({
      where: { id: runId, orgId },
      select: { id: true },
    });
    if (!run) {
      throw new ForbiddenException('Run not found or access denied');
    }

    const orderRows = await this.prisma.orderRow.findMany({
      where: { runId },
      select: {
        marketplace: true,
        category: true,
        orderLineId: true,
        grossAmount: true,
        netPaid: true,
        commissionRateExpected: true,
        logisticsFee: true,
        campaignDiscount: true,
        commissionRefund: true,
        isReturn: true,
      },
    });

    let total_revenue = 0;
    let total_paid = 0;
    let expected_revenue = 0;
    const orderByLine = new Map<
      string,
      { marketplace: string; category: string }
    >();

    for (const r of orderRows) {
      total_revenue += r.grossAmount;
      total_paid += r.netPaid;
      const expectedCommission = r.grossAmount * r.commissionRateExpected;
      let expectedNet =
        r.grossAmount - expectedCommission - r.logisticsFee - r.campaignDiscount;
      if (r.isReturn && r.commissionRefund > 0) {
        expectedNet += r.commissionRefund;
      }
      expected_revenue += expectedNet;
      orderByLine.set(r.orderLineId, {
        marketplace: r.marketplace,
        category: r.category,
      });
    }

    const issueRows = await this.prisma.issueResult.findMany({
      where: { runId },
      select: {
        orderLineId: true,
        issues: true,
        estimatedLoss: true,
        confidenceScore: true,
        attributions: {
          select: {
            ruleName: true,
            loss: true,
            confidence: true,
          },
        },
      },
    });

    const issue_count = issueRows.length;

    const issue_breakdown: IssueBreakdown = {
      COMMISSION_MISMATCH: 0,
      UNDERPAYMENT: 0,
      MISSING_REFUND: 0,
    };

    const amountAccum: Record<string, number> = {
      COMMISSION_MISMATCH: 0,
      UNDERPAYMENT: 0,
      MISSING_REFUND: 0,
    };

    let total_leakage = 0;
    let weightedConfidenceSum = 0;
    let lossSum = 0;
    const categoryMap = new Map<string, number>();
    const marketplaceMap = new Map<string, number>();

    for (const row of issueRows) {
      total_leakage += row.estimatedLoss;
      weightedConfidenceSum += row.estimatedLoss * row.confidenceScore;
      lossSum += row.estimatedLoss;

      const parsed: unknown = JSON.parse(row.issues);
      if (Array.isArray(parsed)) {
        for (const t of parsed) {
          if (typeof t === 'string') {
            issue_breakdown[t] = (issue_breakdown[t] ?? 0) + 1;
          }
        }
      }

      for (const a of row.attributions) {
        amountAccum[a.ruleName] = (amountAccum[a.ruleName] ?? 0) + a.loss;
      }

      const meta = orderByLine.get(row.orderLineId);
      if (meta) {
        categoryMap.set(
          meta.category,
          (categoryMap.get(meta.category) ?? 0) + row.estimatedLoss,
        );
        marketplaceMap.set(
          meta.marketplace,
          (marketplaceMap.get(meta.marketplace) ?? 0) + row.estimatedLoss,
        );
      }
    }

    const leakage_rate =
      total_revenue > 0
        ? Math.round((total_leakage / total_revenue) * 100 * 100) / 100
        : 0;

    const leakage_score = total_leakage * 0.7 + issue_count * 10;

    const unexplained_variance = Math.max(
      0,
      expected_revenue - total_paid - total_leakage,
    );

    const confidence_score =
      total_leakage > 0 && lossSum > 0
        ? weightedConfidenceSum / lossSum
        : 1.0;

    const amount_breakdown: AmountBreakdown = {
      COMMISSION_MISMATCH: round(amountAccum.COMMISSION_MISMATCH ?? 0),
      UNDERPAYMENT: round(amountAccum.UNDERPAYMENT ?? 0),
      MISSING_REFUND: round(amountAccum.MISSING_REFUND ?? 0),
    };

    let topType = 'COMMISSION_MISMATCH';
    let topAmount = -Infinity;
    for (const [type, amount] of Object.entries(amount_breakdown)) {
      if (amount > topAmount) {
        topAmount = amount;
        topType = type;
      }
    }
    if (topAmount < 0) topAmount = 0;
    const top_loss_driver: TopLossDriver = {
      type: topType,
      amount: round(topAmount),
      share: total_leakage > 0 ? round(topAmount / total_leakage) : 0,
    };

    const category_breakdown: BreakdownEntry[] = Array.from(
      categoryMap.entries(),
    )
      .map(([category, leakage]) => ({
        category,
        leakage: round(leakage),
        share: total_leakage > 0 ? round(leakage / total_leakage) : 0,
      }))
      .sort((a, b) => b.leakage - a.leakage)
      .slice(0, 5);

    const marketplace_breakdown: MarketplaceEntry[] = Array.from(
      marketplaceMap.entries(),
    )
      .map(([marketplace, leakage]) => ({
        marketplace,
        leakage: round(leakage),
        share: total_leakage > 0 ? round(leakage / total_leakage) : 0,
      }))
      .sort((a, b) => b.leakage - a.leakage);

    const total_revenue_r = round(total_revenue);
    const total_paid_r = round(total_paid);
    const total_leakage_r = round(total_leakage);
    const expected_revenue_r = round(expected_revenue);
    const unexplained_variance_r = round(unexplained_variance);
    const confidence_score_r = round(confidence_score);

    const insights = this.insightsService.build({
      total_revenue: total_revenue_r,
      total_leakage: total_leakage_r,
      leakage_rate,
      unexplained_variance: unexplained_variance_r,
      confidence_score: confidence_score_r,
      issue_count,
      top_loss_driver,
      amount_breakdown,
      category_breakdown,
      marketplace_breakdown,
    });

    const ROOT_CAUSE_LABELS: Record<RootCause['type'], string> = {
      COMMISSION_MISMATCH: 'Komisyon Farkı',
      UNDERPAYMENT: 'Eksik Ödeme',
      MISSING_REFUND: 'Eksik İade',
    };

    const root_causes: RootCause[] = await Promise.all(
      (
        ['COMMISSION_MISMATCH', 'UNDERPAYMENT', 'MISSING_REFUND'] as const
      ).map(async (type) => {
        const totalLoss = round(amount_breakdown[type] ?? 0);
        const percentage =
          total_leakage_r > 0
            ? Math.round((totalLoss / total_leakage_r) * 1000) / 10
            : 0;
        const top = await this.prisma.issueAttribution.findMany({
          where: {
            ruleName: type,
            issueResult: { runId },
          },
          orderBy: { loss: 'desc' },
          take: 3,
          select: { issueResult: { select: { orderLineId: true } } },
        });
        return {
          type,
          label: ROOT_CAUSE_LABELS[type],
          totalLoss,
          percentage,
          examples: top.map((r) => r.issueResult.orderLineId),
        };
      }),
    );

    const monthly_recovered = total_leakage_r;
    const annual_impact = round(total_leakage_r * 12);

    return {
      runId,
      total_revenue: total_revenue_r,
      total_paid: total_paid_r,
      total_leakage: total_leakage_r,
      leakage_rate,
      leakage_score: round(leakage_score),
      issue_count,
      issue_breakdown,
      expected_revenue: expected_revenue_r,
      recovered_revenue_potential: total_leakage_r,
      monthly_recovered,
      annual_impact,
      unexplained_variance: unexplained_variance_r,
      confidence_score: confidence_score_r,
      top_loss_driver,
      amount_breakdown,
      category_breakdown,
      marketplace_breakdown,
      root_causes,
      insights,
    };
  }
}
