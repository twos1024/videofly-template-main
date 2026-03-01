"use client";

import { useTranslations } from "next-intl";
import { type SceneTemplate } from "@/config/templates";
import { TemplateCard } from "./template-card";

interface TemplateGridProps {
  templates: SceneTemplate[];
  emptyMessage?: string;
}

export function TemplateGrid({
  templates,
  emptyMessage,
}: TemplateGridProps) {
  const t = useTranslations("Templates");

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">{emptyMessage ?? t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
