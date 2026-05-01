import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { UploadModule } from './modules/upload/upload.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { ResultsModule } from './modules/results/results.module';
import { SummaryModule } from './modules/summary/summary.module';
import { RunsModule } from './modules/runs/runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    PrismaModule,
    AuthModule,
    OrgsModule,
    UploadModule,
    ReconciliationModule,
    ResultsModule,
    SummaryModule,
    RunsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
