import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: ['DAILY_LIMIT', 'NEW_PAYEE_CAP', 'VELOCITY'] },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    // Free-form on purpose: each rule needs a different shape, e.g.
    // { maxAmount } for DAILY_LIMIT vs { maxCount, windowSeconds } for VELOCITY.
    params: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

export const Rule = mongoose.model('Rule', ruleSchema);
