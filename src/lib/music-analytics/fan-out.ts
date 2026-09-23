import "server-only";

import { SongstatsError } from "./songstats-client";

/**
 * Songstats rate-limits (429) and can drop connections under load, so
 * transport failures, throttling and upstream errors are retried. A 404 or
 * other 4xx never changes, and each retry costs quota, so the budget is small.
 */
export const withRetry = async <T>(
  task: () => Promise<T>,
  retries = 2,
  backoffMs = 400,
) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      const isRetryable =
        !(error instanceof SongstatsError) ||
        error.status === 429 ||
        error.status >= 500;

      if (!isRetryable || attempt >= retries) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, backoffMs * (attempt + 1)),
      );
    }
  }
};
