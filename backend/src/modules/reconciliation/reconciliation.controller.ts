import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { AuthUser } from '../auth/types/auth-user';
import {
  ReconciliationService,
  ReconciliationSummary,
} from './reconciliation.service';

@Controller('reconcile')
@UseGuards(JwtAuthGuard, OrgContextGuard)
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Post()
  reconcile(
    @Body() body: { runId: string },
    @Req() req: Request & { user: AuthUser },
  ): Promise<ReconciliationSummary> {
    return this.service.runForRunId(body.runId, req.user.orgId as string);
  }
}
