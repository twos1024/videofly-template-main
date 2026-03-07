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

const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_BRANCH_URL ||
  process.env.VERCEL_URL;
const inferredAppUrl = vercelHost ? `https://${vercelHost}` : undefined;
const resolvedAppUrl =
  process.env.NEXT_PUBLIC_APP_URL || inferredAppUrl || "http://localhost:3000";

export const siteConfig: SiteConfig = {
  name: "VideoFly",
  description: "AI 视频生成平台 - 输入灵感即可生成专业视频",
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
