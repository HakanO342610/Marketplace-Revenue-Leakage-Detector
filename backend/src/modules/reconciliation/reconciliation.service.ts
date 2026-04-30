import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketplaceRow } from '../../common/types/marketplace-row';
import { EngineResult, ReconciliationEngine } from './engine/reconciliation.engine';
import { ruleRegistry } from './engine/rule.registry';

export interface ReconciliationSummary {
  runId: string;
  issueCount: number;
  totalLoss: number;
}

const BATCH_SIZE = 50;

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async runForRunId(
    runId: string,
    orgId: string,
  ): Promise<ReconciliationSummary> {
    const run = await this.prisma.uploadRun.findFirst({
      where: { id: runId, orgId },
      select: { id: true },
    });
    if (!run) {
      throw new ForbiddenException('Run not found or access denied');
    }

    const orderRows = await this.prisma.orderRow.findMany({ where: { runId } });
    const rows: MarketplaceRow[] = orderRows.map((r) => ({
      marketplace: r.marketplace,
      sellerId: r.sellerId,
      orderId: r.orderId,
      orderLineId: r.orderLineId,
      sku: r.sku,
      category: r.category,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      grossAmount: r.grossAmount,
      commissionRateExpected: r.commissionRateExpected,
      commissionCharged: r.commissionCharged,
      logisticsFee: r.logisticsFee,
      campaignDiscount: r.campaignDiscount,
      netPaid: r.netPaid,
      orderDate: r.orderDate,
      payoutDate: r.payoutDate,
      isReturn: r.isReturn,
      refundAmount: r.refundAmount,
      commissionRefund: r.commissionRefund,
    }));

    const engine = new ReconciliationEngine(ruleRegistry);
    const all = engine.run(rows);
    const filtered = all.filter((r) => r.issues.length > 0);

    await this.prisma.issueResult.deleteMany({ where: { runId } });

    if (filtered.length > 0) {
      await this.persistResults(runId, filtered);
    }

    const totalLoss =
      Math.round(filtered.reduce((s, r) => s + r.estimatedLoss, 0) * 100) / 100;

    return {
      runId,
      issueCount: filtered.length,
      totalLoss,
    };
  }

  private async persistResults(
    runId: string,
    results: EngineResult[],
  ): Promise<void> {
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const chunk = results.slice(i, i + BATCH_SIZE);
      await Promise.all(
        chunk.map((r) =>
          this.prisma.issueResult.create({
            data: {
              runId,
              orderLineId: r.orderLineId,
              issues: JSON.stringify(r.issues),
              estimatedLoss: r.estimatedLoss,
              expectedAmount: r.expectedAmount,
              actualAmount: r.actualAmount,
              confidenceScore: r.topConfidence > 0 ? r.topConfidence : 1.0,
              attributions: {
                create: r.attributions.map((a) => ({
                  ruleName: a.ruleName,
                  expected: a.expected,
                  actual: a.actual,
                  variance: a.variance,
                  loss: a.loss,
                  severity: a.severity,
                  confidence: a.confidence,
                  explanation: a.explanation,
                })),
              },
            },
          }),
        ),
      );
    }
  }
}
