import { MarketplaceRow } from '../../../common/types/marketplace-row';
import { IRule, RuleEvaluation, Severity } from '../engine/irule';
import { severityFromLoss } from '../engine/severity';

export class RefundRule implements IRule {
  name = 'MISSING_REFUND';

  evaluate(row: MarketplaceRow): RuleEvaluation {
    if (row.isReturn && row.commissionRefund === 0) {
      const loss = row.grossAmount * row.commissionRateExpected;
      const severity: Severity = severityFromLoss(loss);
      const explanation = `İade alındı ama komisyon iadesi yapılmadı — ${loss.toFixed(2)} ₺ tahsil edilmemiş komisyon iadesi.`;

      return {
        flagged: true,
        type: 'MISSING_REFUND',
        loss,
        expected: loss,
        actual: 0,
        severity,
        confidence: 1.0,
        explanation,
      };
    }
    return { flagged: false };
  }
}
