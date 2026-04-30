import type { Severity } from './irule';

export function severityFromLoss(loss: number): Severity {
  if (loss > 1000) return 'critical';
  if (loss > 100) return 'warning';
  return 'info';
}
