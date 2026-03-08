const PLACEHOLDER_HOST_PATTERN =
  /(^|\.)example\.(com|org|net)$|(^|\.)your-domain\.com$/i;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isPrivateIpv4(hostname: string): boolean {
  const segments = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (segments.length !== 4 || segments.some((segment) => Number.isNaN(segment))) {
    return false;
  }

  const [first, second] = segments;

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function normalizePublicHttpsUrl(value?: string): URL | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();

    if (url.protocol !== "https:") return null;
    if (LOOPBACK_HOSTS.has(hostname)) return null;
    if (PLACEHOLDER_HOST_PATTERN.test(hostname)) return null;
    if (isPrivateIpv4(hostname)) return null;

    return url;
  } catch {
    return null;
  }
}

export function resolvePublicCallbackBaseUrl(options: {
  callbackUrl?: string;
  appUrl?: string;
  callbackPath: string;
}): string | undefined {
  const explicitCallbackUrl = normalizePublicHttpsUrl(options.callbackUrl);
  if (explicitCallbackUrl) {
    return explicitCallbackUrl.toString().replace(/\/$/, "");
  }

  const publicAppUrl = normalizePublicHttpsUrl(options.appUrl);
  if (!publicAppUrl) {
    return undefined;
  }

  return new URL(options.callbackPath, publicAppUrl).toString().replace(/\/$/, "");
}
