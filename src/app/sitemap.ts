import { MetadataRoute } from "next";
import { i18n } from "@/config/i18n-config";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

type PublicRoute = {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly";
};

const PUBLIC_ROUTES: PublicRoute[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "pricing", priority: 0.9, changeFrequency: "weekly" },
  { path: "create", priority: 0.8, changeFrequency: "weekly" },
  { path: "image-to-video", priority: 0.7, changeFrequency: "weekly" },
  { path: "text-to-video", priority: 0.7, changeFrequency: "weekly" },
  { path: "reference-to-video", priority: 0.7, changeFrequency: "weekly" },
  { path: "sora-2", priority: 0.7, changeFrequency: "weekly" },
  { path: "veo-3-1", priority: 0.7, changeFrequency: "weekly" },
  { path: "wan-2-6", priority: 0.7, changeFrequency: "weekly" },
  { path: "seedance-1-5", priority: 0.7, changeFrequency: "weekly" },
  { path: "privacy-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "terms-of-service", priority: 0.3, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || siteConfig.url;
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of PUBLIC_ROUTES) {
    for (const locale of i18n.locales) {
      const localePrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
      const path = route.path ? `/${route.path}` : "";

      entries.push({
        url: `${baseUrl}${localePrefix}${path}`,
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  return entries;
}
