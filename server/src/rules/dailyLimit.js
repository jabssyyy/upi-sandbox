import { startOfTodayIST } from '../utils/dates.js';
import { formatPaise } from '../utils/money.js';

// Blocks if today's successful spend plus this transfer would go over the limit.
export default {
  key: 'DAILY_LIMIT',
  paramFields: ['maxAmount'], // paise
  async evaluate(ctx, params) {
    const spentToday = await ctx.sumSpentSince(startOfTodayIST(ctx.now));
    if (spentToday + ctx.amount > params.maxAmount) {
      return { reason: `Daily limit is ${formatPaise(params.maxAmount)}` };
    }
    return null;
  },
};
