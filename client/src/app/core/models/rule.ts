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

// "One of the three rules", as a union. Because each member has its own key,
// checking rule.key === 'VELOCITY' tells TypeScript that params has maxCount and windowSeconds.
export type AnyRule = { [K in RuleKey]: Rule<K> }[RuleKey];

export interface RuleUpdate {
  enabled?: boolean;
  params?: RuleParamsByKey[RuleKey];
}

export interface Stats {
  blockedByRule: { rule: RuleKey; count: number }[];
  volumePerDay: { date: string; amount: number; count: number }[]; // amount in paise, oldest day first
  totals: { success: number; blocked: number };
}

// Rule simulator (admin dry run). Amounts are paise, like the rest of the API.
export interface SimulationRequest {
  fromUpiId: string;
  toUpiId: string;
  amount: number;
}

export type RuleOutcome = 'pass' | 'block' | 'off';

export interface SimulationRow {
  key: RuleKey;
  name: string;
  enabled: boolean;
  outcome: RuleOutcome;
  reason: string | null; // only set when outcome is 'block'
}

export interface SimulationResult {
  sender: { name: string; upiId: string; balance: number };
  receiver: { name: string; upiId: string };
  amount: number;
  enoughBalance: boolean;
  results: SimulationRow[]; // every rule, in engine order
  verdict: { allowed: boolean; rule: RuleKey | null; reason: string | null }; // what a real transfer would do
}
