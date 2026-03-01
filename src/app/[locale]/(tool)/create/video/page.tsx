import { Metadata } from "next";
import type { Locale } from "@/config/i18n-config";
import { getToolPageConfig } from "@/config/tool-pages";
import { ToolPageLayout } from "@/components/tool/tool-page-layout";

export const metadata: Metadata = {
  title: "AI 视频生成 - PixelMuse",
  description: "输入描述或上传图片，AI 生成精美视频",
};

interface Props {
  params: Promise<{ locale: Locale }>;
}

export default async function CreateVideoPage({ params }: Props) {
  const { locale } = await params;
  const config = getToolPageConfig("text-to-video");
  return (
    <ToolPageLayout
      config={config}
      locale={locale}
      toolRoute="text-to-video"
    />
  );
}
