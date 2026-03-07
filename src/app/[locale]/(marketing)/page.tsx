import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { HowItWorks } from "@/components/landing/how-it-works-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";

import type { Locale } from "@/config/i18n-config";
import { siteConfig } from "@/config/site";
import { i18n } from "@/config/i18n-config";
import { buildAlternates, resolveOgImage } from "@/lib/seo";

interface HomePageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

interface PageMetadataProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export async function generateMetadata({ params }: PageMetadataProps) {
  const { locale } = await params;

  const titles = {
    en: "VideoFly - AI Video Generator with Sora 2 and Veo 3.1",
    zh: "VideoFly - 使用 Sora 2 与 Veo 3.1 的 AI 视频生成器",
  };

  const descriptions = {
    en: "Turn a prompt or image into polished AI video with VideoFly. Create with Sora 2, Veo 3.1, Wan 2.6, and more in a streamlined studio built for fast MVP launches.",
    zh: "使用 VideoFly 将文本或图片快速转成高质量 AI 视频。支持 Sora 2、Veo 3.1、Wan 2.6 等模型，面向快速上线的创作工作流。",
  };

  const canonicalUrl = `${siteConfig.url}${locale === i18n.defaultLocale ? "" : `/${locale}`}`;
  const alternates = buildAlternates("/", locale);
  const ogImage = resolveOgImage();

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  return (
    <>
      <HeroSection />
      <ShowcaseSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
      <FAQSection />
    </>
  );
}
