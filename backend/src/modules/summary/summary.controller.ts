import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { AuthUser } from '../auth/types/auth-user';
import { SummaryDto, SummaryService } from './summary.service';

@Controller('summary')
@UseGuards(JwtAuthGuard, OrgContextGuard)
export class SummaryController {
  constructor(private readonly service: SummaryService) {}

  @Get()
  get(
    @Query('runId') runId: string,
    @Req() req: Request & { user: AuthUser },
  ): Promise<SummaryDto> {
    return this.service.get(runId, req.user.orgId as string);
  }
}
