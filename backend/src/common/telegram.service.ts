import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

/**
 * Xpensio'nun mevcut `xpensio_alerts` Telegram kanalına alert atan servis.
 * Bot token ve chat id ortak kullanılıyor — aynı kanalda hem Xpensio hem
 * MRLD bildirimleri görünüyor. Native `https` modülü kullanır, bağımlılık
 * eklemez.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token = process.env.TELEGRAM_BOT_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;

  /** Düz Telegram mesajı gönder. HTML parse mode aktif. */
  async send(text: string): Promise<void> {
    if (!this.token || !this.chatId) {
      this.logger.warn(
        '[Telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID eksik — mesaj atlanıyor.',
      );
      return;
    }
    const body = JSON.stringify({
      chat_id: this.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    await new Promise<void>((resolve) => {
      const req = https.request(
        {
          hostname: 'api.telegram.org',
          path: `/bot${this.token}/sendMessage`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
          timeout: 5000,
        },
        (res) => {
          res.resume();
          if (res.statusCode !== 200) {
            this.logger.warn(`[Telegram] HTTP ${res.statusCode}`);
          }
          resolve();
        },
      );
      req.on('error', (err) => {
        this.logger.error(`[Telegram] ${err.message}`);
        resolve();
      });
      req.on('timeout', () => {
        req.destroy();
        this.logger.warn('[Telegram] timeout');
        resolve();
      });
      req.write(body);
      req.end();
    });
  }

  /**
   * MRLD prefix'li alert. Xpensio formatına benzer `[Brand]\nmessage`.
   * Kullanım:
   *   await telegram.alert('🔴', '5xx error', `path=${path}\n${err.message}`);
   */
  async alert(emoji: string, title: string, message: string): Promise<void> {
    await this.send(
      `${emoji} <b>[MRLD] ${escapeHtml(title)}</b>\n${escapeHtml(message)}`,
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
