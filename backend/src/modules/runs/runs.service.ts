import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RunListItem {
  id: string;
  marketplace: string | null;
  filename: string;
  rowCount: number;
  createdAt: Date;
  totalLeakage: number;
}

@Injectable()
export class RunsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForOrg(orgId: string): Promise<RunListItem[]> {
    const runs = await this.prisma.uploadRun.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        marketplace: true,
        filename: true,
        rowCount: true,
        createdAt: true,
      },
    });

    if (runs.length === 0) {
      return [];
    }

    const grouped = await this.prisma.issueResult.groupBy({
      by: ['runId'],
      where: { runId: { in: runs.map((r) => r.id) } },
      _sum: { estimatedLoss: true },
    });

    const lossByRun = new Map<string, number>();
    for (const g of grouped) {
      lossByRun.set(g.runId, g._sum.estimatedLoss ?? 0);
    }

    return runs.map((r) => ({
      id: r.id,
      marketplace: r.marketplace,
      filename: r.filename,
      rowCount: r.rowCount,
      createdAt: r.createdAt,
      totalLeakage: Math.round((lossByRun.get(r.id) ?? 0) * 100) / 100,
    }));
  }
}
