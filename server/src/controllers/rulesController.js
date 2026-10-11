import { Rule } from '../models/Rule.js';

// Same order the fraud engine checks them in.
const ORDER = ['DAILY_LIMIT', 'NEW_PAYEE_CAP', 'VELOCITY'];

export async function listRules(req, res) {
  const rules = await Rule.find().lean();
  rules.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  res.json({ rules });
}
