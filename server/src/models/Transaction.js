import mongoose from 'mongoose';

// The ledger. Append only: we insert rows and never update or delete them,
// so the history of every attempt (including blocked ones) stays trustworthy.
const ruleHitSchema = new mongoose.Schema(
  { key: { type: String, required: true }, reason: { type: String, required: true } },
  { _id: false },
);

const transactionSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'amount must be whole paise' },
    },
    status: { type: String, enum: ['success', 'blocked'], required: true },
    ruleHit: { type: ruleHitSchema, default: null }, // { key, reason } only when blocked
    note: { type: String, trim: true, maxlength: 60 },
  },
  // Only createdAt: a ledger row never changes, so updatedAt would be meaningless.
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Speeds up "this sender's transactions, newest first", used by history and every fraud rule.
transactionSchema.index({ from: 1, createdAt: -1 });

// Total paise a user has successfully sent since a moment in time.
// Used by GET /wallet ("today's spend") and the DAILY_LIMIT fraud rule.
transactionSchema.statics.sumSpentSince = async function (userId, since) {
  const [row] = await this.aggregate([
    { $match: { from: userId, status: 'success', createdAt: { $gte: since } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return row?.total ?? 0; // no matching rows means nothing spent
};

export const Transaction = mongoose.model('Transaction', transactionSchema);
