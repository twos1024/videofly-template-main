import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTemplateById } from "@/lib/template-utils";
import { TemplateWizardPage } from "@/components/template/template-wizard-page";

interface Props {
  params: Promise<{ templateId: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { templateId, locale } = await params;
  const template = getTemplateById(templateId);
  const t = await getTranslations({ locale, namespace: "Templates" });
  if (!template) return { title: t("notFound") };
  return {
    title: `${template.name} - PexelMuse`,
    description: template.description,
  };
}

export default async function TemplateDetailPage({ params }: Props) {
  const { templateId } = await params;
  const template = getTemplateById(templateId);
  if (!template) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <TemplateWizardPage template={template} />
    </div>
  );
}
