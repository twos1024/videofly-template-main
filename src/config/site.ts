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
  process.env.NEXT_PUBLIC_APP_URL || inferredAppUrl || "https://pixelmuse.app";

export const siteConfig: SiteConfig = {
  name: "PixelMuse",
  description: "AI 智能创作平台 - 场景化模板，一键生成精美图片和视频",
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
