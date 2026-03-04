"use client";

import { useTranslations } from "next-intl";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/config/templates";
import { localizeCategory } from "@/hooks/use-localized-template";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  ShoppingBag,
  Share2,
  Briefcase,
  Sparkles,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  ShoppingBag,
  Share2,
  Briefcase,
  Sparkles,
};

interface TemplateCategoryTabsProps {
  activeCategory: TemplateCategory | "all";
  onCategoryChange: (category: TemplateCategory | "all") => void;
}

export function TemplateCategoryTabs({
  activeCategory,
  onCategoryChange,
}: TemplateCategoryTabsProps) {
  const t = useTranslations("Templates");
  const tData = useTranslations("TemplateData");

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onCategoryChange("all")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
          activeCategory === "all"
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        {t("all")}
      </button>
      {TEMPLATE_CATEGORIES.map((cat) => {
        const Icon = iconMap[cat.icon] ?? LayoutGrid;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {localizeCategory(cat.id, tData, cat.name)}
          </button>
        );
      })}
    </div>
  );
}
