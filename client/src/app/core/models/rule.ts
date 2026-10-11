export type RuleKey = 'DAILY_LIMIT' | 'NEW_PAYEE_CAP' | 'VELOCITY';

// params has a different shape per rule (that is why the server uses MongoDB),
// so each key maps to its own params type.
export interface RuleParamsByKey {
  DAILY_LIMIT: { maxAmount: number }; // paise
  NEW_PAYEE_CAP: { maxAmount: number }; // paise
  VELOCITY: { maxCount: number; windowSeconds: number };
}

export interface Rule<K extends RuleKey = RuleKey> {
  _id: string;
  key: K;
  name: string;
  enabled: boolean;
  params: RuleParamsByKey[K];
  updatedBy: string | null;
  updatedAt: string;
}

export interface RuleUpdate {
  enabled?: boolean;
  params?: RuleParamsByKey[RuleKey];
}

export interface Stats {
  blockedByRule: { rule: RuleKey; count: number }[];
  volumePerDay: { date: string; amount: number; count: number }[]; // amount in paise, oldest day first
  totals: { success: number; blocked: number };
}
