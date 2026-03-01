import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TemplateExplorer } from "@/components/template/template-explorer";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CreatePage" });
  return {
    title: t("metaTitleTemplates"),
    description: t("metaDescTemplates"),
  };
}

export default async function CreatePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CreatePage" });
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("templatesTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("templatesDesc")}</p>
      </div>
      <TemplateExplorer />
    </div>
  );
}
