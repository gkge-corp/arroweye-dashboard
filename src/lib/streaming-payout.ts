/** Per-stream payout range, in USD, used to estimate streaming revenue. */
export const STREAMING_PAYOUT_PER_STREAM = { low: 0.003, high: 0.009 };

export const estimateStreamingRevenue = (streams: number) => ({
  min: streams * STREAMING_PAYOUT_PER_STREAM.low,
  max: streams * STREAMING_PAYOUT_PER_STREAM.high,
});
