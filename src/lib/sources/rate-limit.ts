export async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(task: () => Promise<T>, retries = 2, delayMs = 800): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await delay(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}