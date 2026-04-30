import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import {
  MarketplaceRow,
  REQUIRED_CSV_HEADERS,
} from '../../../common/types/marketplace-row';

const toBool = (v: string): boolean => {
  const s = (v ?? '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
};

const toNum = (v: string): number => {
  const n = Number((v ?? '').trim());
  if (Number.isNaN(n)) throw new BadRequestException(`Invalid numeric value: "${v}"`);
  return n;
};

const toInt = (v: string): number => {
  const n = parseInt((v ?? '').trim(), 10);
  if (Number.isNaN(n)) throw new BadRequestException(`Invalid integer value: "${v}"`);
  return n;
};

export function parseMarketplaceCsv(buffer: Buffer): MarketplaceRow[] {
  let records: Record<string, string>[];
  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown';
    throw new BadRequestException(`CSV parse failed: ${msg}`);
  }

  if (records.length === 0) {
    throw new BadRequestException('CSV is empty');
  }

  const headers = Object.keys(records[0]);
  const missing = REQUIRED_CSV_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new BadRequestException(
      `Missing required CSV headers: ${missing.join(', ')}`,
    );
  }

  return records.map((r) => ({
    marketplace: r.marketplace,
    sellerId: r.seller_id,
    orderId: r.order_id,
    orderLineId: r.order_line_id,
    sku: r.sku,
    category: r.category,
    quantity: toInt(r.quantity),
    unitPrice: toNum(r.unit_price),
    grossAmount: toNum(r.gross_amount),
    commissionRateExpected: toNum(r.commission_rate_expected),
    commissionCharged: toNum(r.commission_charged),
    logisticsFee: toNum(r.logistics_fee),
    campaignDiscount: toNum(r.campaign_discount),
    netPaid: toNum(r.net_paid),
    orderDate: r.order_date,
    payoutDate: r.payout_date,
    isReturn: toBool(r.is_return),
    refundAmount: toNum(r.refund_amount),
    commissionRefund: toNum(r.commission_refund),
  }));
}
