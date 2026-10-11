import { RuleKey } from '../../core/models/rule';

// Friendly names for the fraud rules, shared by the Send page and the receipt.
export const RULE_LABELS: Record<RuleKey, string> = {
  DAILY_LIMIT: 'Daily limit',
  NEW_PAYEE_CAP: 'New payee cap',
  VELOCITY: 'Too many transfers',
};
