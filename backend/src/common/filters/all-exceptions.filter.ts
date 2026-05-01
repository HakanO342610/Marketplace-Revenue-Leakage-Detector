import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';
import { TelegramService } from '../telegram.service';

/**
 * Yakaladığı her exception'ı log + 5xx'ler için Telegram alert.
 * 4xx (BadRequest, Unauthorized, Forbidden, NotFound, vs.) sessiz kalır;
 * bunlar normal client hataları, alert kirletmez.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly telegram: TelegramService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error
        ? exception.message
        : typeof exception === 'string'
          ? exception
          : 'Unknown error';

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: request?.url ?? '',
      message: extractClientMessage(exception),
    };

    httpAdapter.reply(response, responseBody, httpStatus);

    if (httpStatus >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `[5xx] ${request?.method ?? '?'} ${request?.url ?? '?'} — ${message}`,
        stack,
      );

      const truncated = (stack ?? message).slice(0, 1500);
      void this.telegram.alert(
        '🔴',
        `${httpStatus} ${request?.method ?? ''} ${request?.url ?? ''}`,
        `<code>${truncate(message, 240)}</code>\n\n<code>${truncate(truncated, 1500)}</code>`,
      );
    }
  }
}

function extractClientMessage(e: unknown): string | object {
  if (e instanceof HttpException) {
    const r = e.getResponse();
    return typeof r === 'string' ? r : (r as object);
  }
  return 'Internal server error';
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
