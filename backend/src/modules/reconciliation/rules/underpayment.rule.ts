import { MarketplaceRow } from '../../../common/types/marketplace-row';
import { IRule, RuleEvaluation, Severity } from '../engine/irule';
import { severityFromLoss } from '../engine/severity';

export class UnderpaymentRule implements IRule {
  name = 'UNDERPAYMENT';

  evaluate(row: MarketplaceRow): RuleEvaluation {
    const expectedCommission = row.grossAmount * row.commissionRateExpected;
    const expectedNet =
      row.grossAmount - expectedCommission - row.logisticsFee - row.campaignDiscount;
    const netPaid = row.netPaid;

    if (netPaid < expectedNet) {
      const loss = expectedNet - netPaid;
      const denom = expectedNet > 0 ? expectedNet : 1;
      const rawConfidence = 1 - 1 / (1 + loss / denom);
      const confidence = Math.max(0, Math.min(1, rawConfidence));
      const severity: Severity = severityFromLoss(loss);
      const explanation = `Net ödeme ${expectedNet.toFixed(2)} ₺ olmalıydı, ${netPaid.toFixed(2)} ₺ yatmış — ${loss.toFixed(2)} ₺ eksik.`;

      return {
        flagged: true,
        type: 'UNDERPAYMENT',
        loss,
        expected: expectedNet,
        actual: netPaid,
        severity,
        confidence,
        explanation,
      };
    }
    return { flagged: false };
  }
}
