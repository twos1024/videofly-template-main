const RETRYABLE_DB_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "CONNECT_TIMEOUT",
  "57P01",
  "57P02",
  "57P03",
]);

const RETRYABLE_DB_ERROR_PATTERNS = [
  "econnreset",
  "etimedout",
  "connect_timeout",
  "connection terminated",
  "failed query:",
  "could not connect",
];

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const getErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
};

export const isRetryableDbError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  if (code && RETRYABLE_DB_ERROR_CODES.has(code)) return true;

  const message = getErrorMessage(error).toLowerCase();
  return RETRYABLE_DB_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern)
  );
};

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableDbError(error) || attempt === maxRetries) {
        throw error;
      }

      await sleep((attempt + 1) * 150);
    }
  }

  throw lastError;
}
