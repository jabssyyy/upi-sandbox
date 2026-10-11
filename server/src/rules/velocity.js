// Blocks rapid-fire transfers: maxCount or more successful sends inside the time window.
export default {
  key: 'VELOCITY',
  async evaluate(ctx, params) {
    const recent = await ctx.countRecent(params.windowSeconds);
    if (recent >= params.maxCount) {
      return { reason: `Max ${params.maxCount} transfers in ${params.windowSeconds} seconds` };
    }
    return null;
  },
};
