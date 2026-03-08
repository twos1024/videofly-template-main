/**
 * Site configuration
 * Central place for website settings, auth providers, and features
 */
export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    github?: string;
    twitter?: string;
    discord?: string;
  };
  auth: {
    enableGoogleLogin: boolean;
    enableMagicLinkLogin: boolean;
    defaultProvider: "google" | "email";
  };
  routes: {
    defaultLoginRedirect: string;
  };
}

function normalizeAppUrl(value?: string) {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const isLocalHost =
    /^localhost(?::\d+)?(\/.*)?$/i.test(trimmed) ||
    /^127\.0\.0\.1(?::\d+)?(\/.*)?$/i.test(trimmed);

  return `${isLocalHost ? "http" : "https"}://${trimmed}`;
}

const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_BRANCH_URL ||
  process.env.VERCEL_URL;
const inferredAppUrl = normalizeAppUrl(vercelHost);
const resolvedAppUrl =
  normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ||
  inferredAppUrl ||
  "http://localhost:3000";

export const siteConfig: SiteConfig = {
  name: "PexelMuse",
  description: "PexelMuse AI 视频生成平台 - 输入灵感即可生成专业视频",
  url: resolvedAppUrl,
  ogImage: "/og.png",
  links: {},
  auth: {
    enableGoogleLogin: true,
    enableMagicLinkLogin: true,
    defaultProvider: "google",
  },
  routes: {
    defaultLoginRedirect: "/create",
  },
};

// Helper to get enabled auth providers
export function getEnabledAuthProviders() {
  const providers: string[] = [];
  if (siteConfig.auth.enableGoogleLogin) providers.push("google");
  if (siteConfig.auth.enableMagicLinkLogin) providers.push("email");
  return providers;
}
