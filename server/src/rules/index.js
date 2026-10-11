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

export const RULE_KEYS = RULE_MODULES.map((r) => r.key);

// The database accepts any shape for params, so the API checks it here.
// Every field the rule declares must be present as a positive whole number, and nothing extra.
// Returns an error message, or null if the params are fine.
export function checkParams(key, params) {
  const rule = RULE_MODULES.find((r) => r.key === key);
  if (!rule) return `Unknown rule ${key}`;
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    return 'params must be an object';
  }
  const expected = rule.paramFields;
  const extra = Object.keys(params).filter((f) => !expected.includes(f));
  if (extra.length) return `Unknown field(s) for ${key}: ${extra.join(', ')}`;
  for (const field of expected) {
    if (!Number.isInteger(params[field]) || params[field] < 1) {
      return `${field} must be a whole number of at least 1`;
    }
  }
  return null;
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

// For the admin's dry run. Unlike runRules it does NOT stop at the first hit:
// it reports every rule, in engine order, so the admin sees the full picture.
// Rules only run read queries, so this never changes the database.
export async function evaluateAll(ctx) {
  const docs = await Rule.find().lean();
  const docByKey = new Map(docs.map((r) => [r.key, r]));

  const results = [];
  for (const rule of RULE_MODULES) {
    const doc = docByKey.get(rule.key);
    const name = doc?.name ?? rule.key;
    if (!doc?.enabled) {
      // Disabled (or missing) rules are not evaluated, exactly like runRules skips them.
      results.push({ key: rule.key, name, enabled: false, outcome: 'off', reason: null });
      continue;
    }
    const hit = await rule.evaluate(ctx, doc.params);
    results.push({ key: rule.key, name, enabled: true, outcome: hit ? 'block' : 'pass', reason: hit ? hit.reason : null });
  }
  return results;
}
