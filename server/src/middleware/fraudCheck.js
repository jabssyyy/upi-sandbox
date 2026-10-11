import { matchedData } from 'express-validator';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { buildContext, runRules } from '../rules/index.js';
import { appEvents } from '../events/appEvents.js';
import { AppError } from '../utils/AppError.js';

// Runs after authRequired and validate, before the transfer handler.
// On success it leaves req.transfer = { sender, receiver, amount, note } for the handler.
export async function fraudCheck(req, res, next) {
  const { toUpiId, amount, note } = matchedData(req);
  const sender = req.user;

  // 1. Hard checks. These are plain mistakes, not fraud, so they are NOT logged as blocked.
  const receiver = await User.findOne({ upiId: toUpiId });
  if (!receiver) throw new AppError('NOT_FOUND', 404, `No user with UPI id ${toUpiId}`);
  if (receiver._id.equals(sender._id)) {
    throw new AppError('VALIDATION_ERROR', 400, 'You cannot send money to yourself');
  }
  if (sender.balance < amount) {
    // A friendly early answer. The real guarantee is the conditional debit in transferService.
    throw new AppError('INSUFFICIENT_BALANCE', 400, 'Not enough balance');
  }

  // 2. Fraud rules.
  const ruleHit = await runRules(buildContext({ sender, receiver, amount }));
  if (ruleHit) {
    // Record the attempt in the ledger so the admin can see it later.
    await Transaction.create({ from: sender._id, to: receiver._id, amount, status: 'blocked', ruleHit, note });
    appEvents.emit('transfer.blocked', { sender, receiver, amount, ruleHit });
    throw new AppError('FRAUD_BLOCKED', 403, ruleHit.reason, { rule: ruleHit.key });
  }

  req.transfer = { sender, receiver, amount, note };
  next();
}
