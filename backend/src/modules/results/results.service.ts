import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ResultDto {
  orderLineId: string;
  issues: string[];
  estimatedLoss: number;
  expectedAmount: number;
  actualAmount: number;
}

export interface AttributionDto {
  ruleName: string;
  expected: number;
  actual: number;
  variance: number;
  loss: number;
  severity: string;
  confidence: number;
  explanation: string;
}

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async find(
    runId: string,
    orgId: string,
    issueType?: string,
    limit?: number,
  ): Promise<ResultDto[]> {
    await this.assertRunOwnership(runId, orgId);

    const take = limit && limit > 0 ? limit : 500;
    const rows = await this.prisma.issueResult.findMany({
      where: {
        runId,
        ...(issueType ? { issues: { contains: issueType } } : {}),
      },
      take,
    });

    return rows.map((r) => {
      const parsed: unknown = JSON.parse(r.issues);
      const issues: string[] = Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === 'string')
        : [];
      return {
        orderLineId: r.orderLineId,
        issues,
        estimatedLoss: r.estimatedLoss,
        expectedAmount: r.expectedAmount,
        actualAmount: r.actualAmount,
      };
    });
  }

  async getAttributions(
    runId: string,
    orderLineId: string,
    orgId: string,
  ): Promise<AttributionDto[]> {
    await this.assertRunOwnership(runId, orgId);

    const issue = await this.prisma.issueResult.findFirst({
      where: { runId, orderLineId },
      include: { attributions: true },
    });

    if (!issue) return [];

    return issue.attributions.map((a) => ({
      ruleName: a.ruleName,
      expected: a.expected,
      actual: a.actual,
      variance: a.variance,
      loss: a.loss,
      severity: a.severity,
      confidence: a.confidence,
      explanation: a.explanation,
    }));
  }

  private async assertRunOwnership(
    runId: string,
    orgId: string,
  ): Promise<void> {
    const run = await this.prisma.uploadRun.findFirst({
      where: { id: runId, orgId },
      select: { id: true },
    });
    if (!run) {
      throw new ForbiddenException('Run not found or access denied');
    }
  }
}
