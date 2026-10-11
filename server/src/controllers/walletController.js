import { matchedData } from 'express-validator';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { startOfTodayIST } from '../utils/dates.js';

export async function getWallet(req, res) {
  const todaySpent = await Transaction.sumSpentSince(req.user._id, startOfTodayIST());
  res.json({ balance: req.user.balance, todaySpent });
}

export async function topup(req, res) {
  const { amount } = matchedData(req);
  // $inc adds in one atomic database step, so two top-ups at once can't overwrite each other.
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { balance: amount } },
    { returnDocument: 'after' },
  );
  res.json({ balance: user.balance });
}
