"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { TemplateGrid } from "./template-grid";
import { TemplateCategoryTabs } from "./template-category-tabs";
import { type TemplateCategory } from "@/config/templates";
import { SCENE_TEMPLATES } from "@/config/template-data";
import { localizeTemplate } from "@/hooks/use-localized-template";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function TemplateExplorer() {
  const t = useTranslations("Templates");
  const tData = useTranslations("TemplateData");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    let result = SCENE_TEMPLATES;
    if (category !== "all") {
      result = result.filter((tmpl) => tmpl.category === category);
    }
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter((tmpl) => {
        const loc = localizeTemplate(tmpl, tData);
        return (
          loc.name.toLowerCase().includes(lower) ||
          loc.description.toLowerCase().includes(lower) ||
          loc.tags.some((tag) => tag.toLowerCase().includes(lower))
        );
      });
    }
    return result;
  }, [category, search, tData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TemplateCategoryTabs activeCategory={category} onCategoryChange={setCategory} />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <TemplateGrid templates={filteredTemplates} emptyMessage={t("noResults")} />
    </div>
  );
}
