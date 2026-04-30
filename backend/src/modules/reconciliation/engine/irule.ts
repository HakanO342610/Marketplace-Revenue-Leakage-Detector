import { MarketplaceRow } from '../../../common/types/marketplace-row';

export type Severity = 'info' | 'warning' | 'critical';

export interface RuleEvaluation {
  flagged: boolean;
  type?: string;
  loss?: number;
  expected?: number;
  actual?: number;
  severity?: Severity;
  confidence?: number;
  explanation?: string;
}

export interface IRule {
  name: string;
  evaluate(row: MarketplaceRow): RuleEvaluation;
}
