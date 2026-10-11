import { matchedData } from 'express-validator';
import { Transaction } from '../models/Transaction.js';
import { daysAgoIST } from '../utils/dates.js';

// GET /admin/blocked?page=&limit=  Every blocked attempt, newest first, with names.
export async function listBlocked(req, res) {
  const { page = 1, limit = 20 } = matchedData(req);
  const filter = { status: 'blocked' };

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('from', 'name upiId')
      .populate('to', 'name upiId')
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

// GET /admin/stats  Two aggregation pipelines for the admin dashboard.
export async function stats(req, res) {
  const since = daysAgoIST(6); // today plus the 6 days before it

  const [blockedByRule, perDay, totals] = await Promise.all([
    // 1. How many transfers each rule has blocked, biggest first.
    Transaction.aggregate([
      { $match: { status: 'blocked' } },
      { $group: { _id: '$ruleHit.key', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, rule: '$_id', count: 1 } },
    ]),

    // 2. Successful money moved per IST calendar day.
    Transaction.aggregate([
      { $match: { status: 'success', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),

    // 3. Overall counts, split by status.
    Transaction.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  // Days with no transfers don't appear in the aggregation, so fill them with zeros:
  // the chart should always show 7 bars.
  const byDay = new Map(perDay.map((d) => [d._id, d]));
  const volumePerDay = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(daysAgoIST(i).getTime() + 12 * 60 * 60 * 1000) // midday, safely inside the IST day
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA formats as YYYY-MM-DD
    volumePerDay.push({ date, amount: byDay.get(date)?.amount ?? 0, count: byDay.get(date)?.count ?? 0 });
  }

  const countOf = (status) => totals.find((t) => t._id === status)?.count ?? 0;
  res.json({
    blockedByRule,
    volumePerDay,
    totals: { success: countOf('success'), blocked: countOf('blocked') },
  });
}
