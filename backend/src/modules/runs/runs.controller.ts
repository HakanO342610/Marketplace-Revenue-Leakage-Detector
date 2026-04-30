import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { AuthUser } from '../auth/types/auth-user';
import { RunListItem, RunsService } from './runs.service';

@Controller('runs')
@UseGuards(JwtAuthGuard, OrgContextGuard)
export class RunsController {
  constructor(private readonly service: RunsService) {}

  @Get()
  listRuns(
    @Req() req: Request & { user: AuthUser },
  ): Promise<RunListItem[]> {
    return this.service.listForOrg(req.user.orgId as string);
  }
}
