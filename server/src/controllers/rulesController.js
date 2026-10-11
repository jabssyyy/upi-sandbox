import { matchedData } from 'express-validator';
import { Rule } from '../models/Rule.js';
import { User } from '../models/User.js';
import { RULE_KEYS, buildContext, evaluateAll } from '../rules/index.js';
import { appEvents } from '../events/appEvents.js';
import { AppError } from '../utils/AppError.js';

export async function listRules(req, res) {
  const rules = await Rule.find().lean();
  // Same order the fraud engine checks them in.
  rules.sort((a, b) => RULE_KEYS.indexOf(a.key) - RULE_KEYS.indexOf(b.key));
  res.json({ rules });
}

// PUT /rules/:key  body: { enabled?, params? }  (validated in routes/rules.js)
export async function updateRule(req, res) {
  const { key, enabled, params } = matchedData(req);

  const changes = { updatedBy: req.user._id };
  if (enabled !== undefined) changes.enabled = enabled;
  if (params !== undefined) changes.params = params;

  const rule = await Rule.findOneAndUpdate({ key }, { $set: changes }, { returnDocument: 'after' }).lean();
  if (!rule) throw new AppError('NOT_FOUND', 404, `Rule ${key} is missing. Run npm run seed.`);

  appEvents.emit('rule.updated', { rule, admin: req.user });
  // No cache to clear: the fraud engine reads rules from the database on every transfer.
  res.json({ rule });
}

// POST /rules/simulate  body: { fromUpiId, toUpiId, amount }  (validated in routes/rules.js)
// A dry run of a transfer: the same checks as fraudCheck, but it only READS.
// No transaction is saved, no balance changes and no event is emitted.
export async function simulateTransfer(req, res) {
  const { fromUpiId, toUpiId, amount } = matchedData(req);

  const [sender, receiver] = await Promise.all([
    User.findOne({ upiId: fromUpiId }).lean(),
    User.findOne({ upiId: toUpiId }).lean(),
  ]);
  if (!sender) throw new AppError('NOT_FOUND', 404, `No user with UPI id ${fromUpiId}`);
  if (!receiver) throw new AppError('NOT_FOUND', 404, `No user with UPI id ${toUpiId}`);
  if (sender._id.equals(receiver._id)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Sender and receiver must be different people');
  }

  const enoughBalance = sender.balance >= amount;
  const results = await evaluateAll(buildContext({ sender, receiver, amount }));

  // The verdict is what a real transfer would do: balance first, then the FIRST rule that blocks.
  const firstBlock = results.find((r) => r.outcome === 'block');
  let verdict = { allowed: true, rule: null, reason: null };
  if (!enoughBalance) verdict = { allowed: false, rule: null, reason: 'Not enough balance' };
  else if (firstBlock) verdict = { allowed: false, rule: firstBlock.key, reason: firstBlock.reason };

  res.json({
    sender: { name: sender.name, upiId: sender.upiId, balance: sender.balance },
    receiver: { name: receiver.name, upiId: receiver.upiId },
    amount,
    enoughBalance,
    results,
    verdict,
  });
}
