export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  timeoutMs: number;
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions,
  onRetry?: (attempt: number, error: unknown) => void
): Promise<{ value: T; attempts: number }> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.retries + 1; attempt += 1) {
    try {
      const value = await withTimeout(operation(attempt), options.timeoutMs);
      return { value, attempts: attempt };
    } catch (error) {
      lastError = error;

      if (attempt > options.retries) {
        break;
      }

      onRetry?.(attempt, error);
      await sleep(options.baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Retry operation failed");
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

