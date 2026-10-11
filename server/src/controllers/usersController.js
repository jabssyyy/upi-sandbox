import { matchedData } from 'express-validator';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

// Lets the send form show "Paying Ravi Kumar" before money moves.
// Returns the name only: never the balance or email of someone else.
export async function lookup(req, res) {
  const { upiId } = matchedData(req);
  const user = await User.findOne({ upiId }).select('name upiId').lean();
  if (!user) throw new AppError('NOT_FOUND', 404, `No user with UPI id ${upiId}`);
  res.json({ name: user.name, upiId: user.upiId });
}
