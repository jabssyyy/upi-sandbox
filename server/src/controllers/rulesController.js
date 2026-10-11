import { matchedData } from 'express-validator';
import { Rule } from '../models/Rule.js';
import { RULE_KEYS } from '../rules/index.js';
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
