import { RuleKey } from '../../core/models/rule';

// Human wording for each rule, shared by the two admin pages.

// The engine's order. The stats use it so every rule shows, even with 0 blocks.
export const RULE_KEYS: RuleKey[] = ['DAILY_LIMIT', 'NEW_PAYEE_CAP', 'VELOCITY'];

// Short labels for badges and bars.
export const RULE_LABELS: Record<RuleKey, string> = {
  DAILY_LIMIT: 'Daily limit',
  NEW_PAYEE_CAP: 'New payee cap',
  VELOCITY: 'Velocity',
};

// One plain-English line per rule for the rules page.
export const RULE_DESCRIPTIONS: Record<RuleKey, string> = {
  DAILY_LIMIT: "Blocks a transfer if today's total spend would go over this amount.",
  NEW_PAYEE_CAP: 'Blocks a first payment to someone new above this amount.',
  VELOCITY: 'Blocks rapid-fire transfers: too many in a short time.',
};
