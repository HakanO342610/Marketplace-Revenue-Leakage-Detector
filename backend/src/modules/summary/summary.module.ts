import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InsightsService } from './insights.service';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';

@Module({
  imports: [AuthModule],
  controllers: [SummaryController],
  providers: [SummaryService, InsightsService],
  exports: [SummaryService],
})
export class SummaryModule {}
