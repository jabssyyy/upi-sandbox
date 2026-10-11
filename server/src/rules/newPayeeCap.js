import { formatPaise } from '../utils/money.js';

// Blocks a large first payment to someone the sender has never paid before.
export default {
  key: 'NEW_PAYEE_CAP',
  async evaluate(ctx, params) {
    // Cheap check first: small amounts pass without touching the database.
    if (ctx.amount <= params.maxAmount) return null;
    if (await ctx.hasPaidBefore()) return null;
    return { reason: `New payee limit is ${formatPaise(params.maxAmount)}` };
  },
};
