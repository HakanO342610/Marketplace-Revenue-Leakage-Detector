import { MarketplaceRow } from '../../../common/types/marketplace-row';
import { IRule, Severity } from './irule';

export interface AttributionResult {
  ruleName: string;
  expected: number;
  actual: number;
  variance: number;
  loss: number;
  severity: Severity;
  confidence: number;
  explanation: string;
}

export interface EngineResult {
  orderLineId: string;
  issues: string[];
  estimatedLoss: number;
  expectedAmount: number;
  actualAmount: number;
  attributions: AttributionResult[];
  topConfidence: number;
}

const round = (n: number): number => Math.round(n * 100) / 100;

export class ReconciliationEngine {
  constructor(private rules: IRule[]) {}

  run(rows: MarketplaceRow[]): EngineResult[] {
    const results: EngineResult[] = [];
    for (const row of rows) {
      const issues: string[] = [];
      let estimatedLoss = 0;
      let expectedAmount: number | undefined;
      let actualAmount: number | undefined;
      const attributions: AttributionResult[] = [];
      let topConfidence = 0;

      for (const rule of this.rules) {
        const evaluation = rule.evaluate(row);
        if (!evaluation.flagged) continue;

        if (evaluation.type) {
          issues.push(evaluation.type);
        }
        const loss = evaluation.loss ?? 0;
        estimatedLoss += loss;

        if (
          expectedAmount === undefined &&
          evaluation.expected !== undefined &&
          evaluation.actual !== undefined
        ) {
          expectedAmount = evaluation.expected;
          actualAmount = evaluation.actual;
        }

        const expected = evaluation.expected ?? 0;
        const actual = evaluation.actual ?? 0;
        const variance = expected - actual;
        const severity: Severity = evaluation.severity ?? 'info';
        const confidence = evaluation.confidence ?? 0;
        const explanation = evaluation.explanation ?? '';

        if (confidence > topConfidence) topConfidence = confidence;

        attributions.push({
          ruleName: evaluation.type ?? rule.name,
          expected: round(expected),
          actual: round(actual),
          variance: round(variance),
          loss: round(loss),
          severity,
          confidence: round(confidence),
          explanation,
        });
      }

      results.push({
        orderLineId: row.orderLineId,
        issues,
        estimatedLoss: round(estimatedLoss),
        expectedAmount: round(expectedAmount ?? row.grossAmount),
        actualAmount: round(actualAmount ?? row.netPaid),
        attributions,
        topConfidence: round(topConfidence),
      });
    }
    return results;
  }
}
