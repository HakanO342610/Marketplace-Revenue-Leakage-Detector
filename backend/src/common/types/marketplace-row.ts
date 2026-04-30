export interface MarketplaceRow {
  marketplace: string;
  sellerId: string;
  orderId: string;
  orderLineId: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  commissionRateExpected: number;
  commissionCharged: number;
  logisticsFee: number;
  campaignDiscount: number;
  netPaid: number;
  orderDate: string;
  payoutDate: string;
  isReturn: boolean;
  refundAmount: number;
  commissionRefund: number;
}

export const REQUIRED_CSV_HEADERS = [
  'marketplace',
  'seller_id',
  'order_id',
  'order_line_id',
  'sku',
  'category',
  'quantity',
  'unit_price',
  'gross_amount',
  'commission_rate_expected',
  'commission_charged',
  'logistics_fee',
  'campaign_discount',
  'net_paid',
  'order_date',
  'payout_date',
  'is_return',
  'refund_amount',
  'commission_refund',
] as const;
