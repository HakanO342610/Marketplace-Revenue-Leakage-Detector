import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
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
    PrismaModule,
    AuthModule,
    OrgsModule,
    UploadModule,
    ReconciliationModule,
    ResultsModule,
    SummaryModule,
    RunsModule,
  ],
})
export class AppModule {}
