import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { AuthUser } from '../auth/types/auth-user';
import {
  AttributionDto,
  ResultDto,
  ResultsService,
} from './results.service';

@Controller('results')
@UseGuards(JwtAuthGuard, OrgContextGuard)
export class ResultsController {
  constructor(private readonly service: ResultsService) {}

  @Get()
  find(
    @Req() req: Request & { user: AuthUser },
    @Query('runId') runId: string,
    @Query('issueType') issueType?: string,
    @Query('limit') limit?: string,
  ): Promise<ResultDto[]> {
    const parsedLimit = limit !== undefined ? parseInt(limit, 10) : undefined;
    const finalLimit =
      parsedLimit !== undefined && !Number.isNaN(parsedLimit)
        ? parsedLimit
        : undefined;
    return this.service.find(
      runId,
      req.user.orgId as string,
      issueType,
      finalLimit,
    );
  }

  @Get(':orderLineId/attributions')
  getAttributions(
    @Param('orderLineId') orderLineId: string,
    @Query('runId') runId: string,
    @Req() req: Request & { user: AuthUser },
  ): Promise<AttributionDto[]> {
    return this.service.getAttributions(
      runId,
      orderLineId,
      req.user.orgId as string,
    );
  }
}
