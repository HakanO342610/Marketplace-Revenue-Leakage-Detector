import { MarketplaceRow } from '../../../common/types/marketplace-row';
import { IRule, RuleEvaluation, Severity } from '../engine/irule';
import { getDynamicThreshold } from '../engine/threshold';

export class CommissionRule implements IRule {
  name = 'COMMISSION_MISMATCH';

  evaluate(row: MarketplaceRow): RuleEvaluation {
    const expected = row.grossAmount * row.commissionRateExpected;
    const actual = row.commissionCharged;
    const diff = actual - expected;
    const threshold = getDynamicThreshold(row.grossAmount);

    if (Math.abs(diff) > threshold) {
      const absDiff = Math.abs(diff);
      const safeThreshold = threshold > 0 ? threshold : 1;
      const rawConfidence = 1 - 1 / (1 + absDiff / safeThreshold);
      const confidence = Math.max(0, Math.min(1, rawConfidence));

      let severity: Severity;
      if (absDiff > 1000) severity = 'critical';
      else if (absDiff > 100) severity = 'warning';
      else severity = 'info';

      const explanation = `Beklenen komisyon ${expected.toFixed(2)} ₺ ama ${actual.toFixed(2)} ₺ kesilmiş — ${absDiff.toFixed(2)} ₺ fark.`;

      return {
        flagged: true,
        type: 'COMMISSION_MISMATCH',
        loss: absDiff,
        expected,
        actual,
        severity,
        confidence,
        explanation,
      };
    }
    return { flagged: false };
  }
}
