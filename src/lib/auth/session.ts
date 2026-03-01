import { auth, type Session } from "./auth";

const RETRYABLE_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "CONNECT_TIMEOUT",
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
]);

const RETRYABLE_ERROR_PATTERNS = [
  "ECONNRESET",
  "ETIMEDOUT",
  "CONNECT_TIMEOUT",
  "connection terminated",
  "could not connect",
  "Failed query:",
];

const SESSION_COOKIE_PATTERNS = [
  "session_token=",
  "better-auth.session_token=",
  "__secure-better-auth.session_token=",
];

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isRetryableSessionError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (code && RETRYABLE_ERROR_CODES.has(code)) return true;

  const message = getErrorMessage(error).toLowerCase();
  return RETRYABLE_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern.toLowerCase())
  );
}

/**
 * Fetch session with tiny retries to smooth transient DB/network failures.
 */
export async function getSessionWithRetry(
  headers: Headers,
  maxRetries = 2
): Promise<Session | null> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const session = await auth.api.getSession({ headers });
      return (session as Session | null) ?? null;
    } catch (error) {
      lastError = error;

      if (!isRetryableSessionError(error) || attempt === maxRetries) {
        throw error;
      }

      await sleep((attempt + 1) * 120);
    }
  }

  throw lastError;
}

/**
 * Safe session read for guards and API auth.
 * Any failure is treated as unauthenticated to avoid 500 on protected pages.
 */
export async function getSessionSafe(headers: Headers): Promise<Session | null> {
  const cookieHeader = headers.get("cookie")?.toLowerCase() ?? "";
  const hasSessionCookie = SESSION_COOKIE_PATTERNS.some((pattern) =>
    cookieHeader.includes(pattern)
  );
  if (!hasSessionCookie) {
    return null;
  }

  try {
    return await getSessionWithRetry(headers);
  } catch (error) {
    console.warn("[Auth] getSession failed, treat as unauthenticated", error);
    return null;
  }
}
