import { UserRef } from './user';
import { RuleKey } from './rule';

export type TransactionStatus = 'success' | 'blocked';

export interface RuleHit {
  key: RuleKey;
  reason: string;
}

// A ledger row as returned by GET /transfers and GET /admin/blocked.
export interface Transaction {
  _id: string;
  from: UserRef;
  to: UserRef;
  amount: number; // paise
  status: TransactionStatus;
  ruleHit: RuleHit | null;
  note?: string;
  createdAt: string; // ISO date string
  direction?: 'sent' | 'received'; // only on GET /transfers
}

// One page of results from any paginated endpoint.
export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HistoryFilters {
  status?: TransactionStatus;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface TransferRequest {
  toUpiId: string;
  amount: number; // paise
  note?: string;
}

// POST /transfers success response. from/to are plain ids here (not populated).
export interface TransferResult {
  transaction: { _id: string; amount: number; status: TransactionStatus; note?: string; createdAt: string };
  balance: number; // sender's new balance, paise
}
