import "server-only";

import { SoundchartsError } from "./soundcharts-client";

export const mapWithConcurrency = async <Item, Result>(
  items: readonly Item[],
  limit: number,
  task: (item: Item) => Promise<Result>,
) => {
  const results: Result[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await task(items[index]);
      }
    },
  );

  await Promise.all(workers);
  return results;
};

/**
 * Soundcharts drops connections when many platforms are requested at once, so
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
        !(error instanceof SoundchartsError) ||
        error.status === 429 ||
        error.status >= 500;

      if (!isRetryable || attempt >= retries) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, backoffMs * (attempt + 1)),
      );
    }
  }
};
