import { Rule } from '../models/Rule.js';
import { Transaction } from '../models/Transaction.js';
import dailyLimit from './dailyLimit.js';
import newPayeeCap from './newPayeeCap.js';
import velocity from './velocity.js';

// Checked in this order; the first rule that objects wins.
const RULE_MODULES = [dailyLimit, newPayeeCap, velocity];

// Everything a rule may need to know about the transfer, plus small query helpers,
// so rule files stay short and never build Mongo queries themselves.
export function buildContext({ sender, receiver, amount, now = new Date() }) {
  return {
    sender,
    receiver,
    amount,
    now,
    sumSpentSince: (date) => Transaction.sumSpentSince(sender._id, date),
    hasPaidBefore: async () =>
      Boolean(await Transaction.exists({ from: sender._id, to: receiver._id, status: 'success' })),
    countRecent: (seconds) =>
      Transaction.countDocuments({
        from: sender._id,
        status: 'success',
        createdAt: { $gte: new Date(now.getTime() - seconds * 1000) },
      }),
  };
}

// Returns null if the transfer is allowed, or { key, reason } for the first rule it breaks.
export async function runRules(ctx) {
  // Read from the database on EVERY transfer (no cache): an admin's edit applies to the very next one.
  const enabled = await Rule.find({ enabled: true }).lean();
  const paramsByKey = new Map(enabled.map((r) => [r.key, r.params]));

  for (const rule of RULE_MODULES) {
    if (!paramsByKey.has(rule.key)) continue; // disabled or missing: skip
    const hit = await rule.evaluate(ctx, paramsByKey.get(rule.key));
    if (hit) return { key: rule.key, reason: hit.reason };
  }
  return null;
}
