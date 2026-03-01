import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/i18n-config";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  const alternates = buildAlternates("/privacy-policy", locale);

  return {
    title: t("metaTitle"),
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
  };
}

export default function PrivacyPolicyPage() {
  const t = useTranslations("Privacy");
  const year = new Date().getFullYear().toString();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <div className="prose dark:prose-invert">
        <p>{t("lastUpdated", { year })}</p>

        <h2>{t("section1Title")}</h2>
        <p>{t("section1Text")}</p>

        <h2>{t("section2Title")}</h2>
        <p>{t("section2Text")}</p>

        <h2>{t("section3Title")}</h2>
        <p>{t("section3Text")}</p>

        <h2>{t("section4Title")}</h2>
        <p>{t("section4Text")}</p>

        <h2>{t("section5Title")}</h2>
        <p>{t("section5Text")}</p>
      </div>
    </div>
  );
}
