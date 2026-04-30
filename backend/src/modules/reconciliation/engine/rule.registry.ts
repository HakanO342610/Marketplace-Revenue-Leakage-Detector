import { IRule } from './irule';
import { CommissionRule } from '../rules/commission.rule';
import { UnderpaymentRule } from '../rules/underpayment.rule';
import { RefundRule } from '../rules/refund.rule';

export const ruleRegistry: IRule[] = [
  new CommissionRule(),
  new UnderpaymentRule(),
  new RefundRule(),
];
