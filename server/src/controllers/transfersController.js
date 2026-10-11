import { matchedData } from 'express-validator';
import { Transaction } from '../models/Transaction.js';
import * as transferService from '../services/transferService.js';

// POST /transfers. By the time we get here, auth, validation and fraudCheck have all passed.
export async function createTransfer(req, res) {
  const { transaction, balance } = await transferService.execute(req.transfer);
  res.status(201).json({ transaction, balance });
}

// GET /transfers?status=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=&limit=
export async function listTransfers(req, res) {
  const { status, from, to, page = 1, limit = 10 } = matchedData(req);
  const me = req.user._id;

  // Money I sent (success or blocked), plus money I received. Blocked attempts
  // against me stay hidden: they never reached my account.
  const filter = { $or: [{ from: me }, { to: me, status: 'success' }] };
  if (status) filter.status = status;

  // Dates in the query mean whole days in Indian time.
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000+05:30`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999+05:30`);
  }

  const [rows, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 }) // newest first
      .skip((page - 1) * limit) // jump over earlier pages
      .limit(limit)
      .populate('from', 'name upiId') // swap the ObjectId for the user's name and UPI id
      .populate('to', 'name upiId')
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  const items = rows.map((t) => ({
    ...t,
    direction: t.from._id.equals(me) ? 'sent' : 'received',
  }));

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}
