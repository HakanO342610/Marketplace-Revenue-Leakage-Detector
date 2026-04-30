import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseMarketplaceCsv } from './parsers/csv.parser';
import { UploadResponseDto } from './dto/upload-response.dto';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async process(
    file: Express.Multer.File,
    userId: string,
    orgId: string,
    marketplace?: string,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const rows = parseMarketplaceCsv(file.buffer);

    const run = await this.prisma.uploadRun.create({
      data: {
        userId,
        orgId,
        marketplace: marketplace ?? null,
        filename: file.originalname,
        rowCount: rows.length,
      },
    });

    await this.prisma.orderRow.createMany({
      data: rows.map((r) => ({ ...r, runId: run.id })),
    });

    return {
      runId: run.id,
      rowCount: rows.length,
      marketplace: marketplace,
    };
  }
}
