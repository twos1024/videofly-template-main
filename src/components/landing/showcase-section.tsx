"use client";

import { useState } from "react";
import { LocaleLink as Link } from "@/i18n/navigation";
import { ArrowRight, Image as ImageIcon, Video, Gem, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { BlurFade } from "@/components/magicui/blur-fade";
import { cn } from "@/components/ui";
import { SCENE_TEMPLATES } from "@/config/template-data";
import { localizeTemplate } from "@/hooks/use-localized-template";

type CategoryKey = "all" | "ecommerce" | "social-media" | "business" | "personal";

// 类型标签颜色映射
const TYPE_COLORS: Record<string, string> = {
  image: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  video: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

// 分类颜色
const CATEGORY_COLORS: Record<string, string> = {
  ecommerce: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "social-media": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  business: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  personal: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

// 封面占位渐变色
const COVER_GRADIENTS = [
  "from-emerald-400/30 to-teal-600/30",
  "from-sky-400/30 to-blue-600/30",
  "from-violet-400/30 to-purple-600/30",
  "from-rose-400/30 to-pink-600/30",
  "from-amber-400/30 to-orange-600/30",
  "from-cyan-400/30 to-blue-500/30",
];

export function ShowcaseSection() {
  const t = useTranslations("Showcase");
  const tTemplates = useTranslations("Templates");
  const tData = useTranslations("TemplateData");
  const [activeTab, setActiveTab] = useState<CategoryKey>("all");

  const TABS: { key: CategoryKey; label: string }[] = [
    { key: "all", label: t("tabAll") },
    { key: "ecommerce", label: t("tabEcommerce") },
    { key: "social-media", label: t("tabSocial") },
    { key: "business", label: t("tabBusiness") },
    { key: "personal", label: t("tabPersonal") },
  ];

  const TYPE_LABELS: Record<string, string> = {
    image: tTemplates("imageType"),
    video: tTemplates("videoType"),
  };

  const CATEGORY_LABELS: Record<string, string> = {
    ecommerce: t("tabEcommerce"),
    "social-media": t("tabSocial"),
    business: t("tabBusiness"),
    personal: t("tabPersonal"),
  };

  const filteredTemplates =
    activeTab === "all"
      ? SCENE_TEMPLATES.slice(0, 8)
      : SCENE_TEMPLATES.filter((tmpl) => tmpl.category === activeTab).slice(0, 8);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="container mx-auto px-4">
        {/* 区域标题 */}
        <BlurFade inView>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("badge")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("titleLine1")}
              <span className="text-primary">{t("titleLine2")}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </BlurFade>

        {/* Tab 切换 */}
        <BlurFade delay={0.1} inView>
          <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </BlurFade>

        {/* 模板网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {filteredTemplates.map((template, idx) => (
            <BlurFade key={template.id} delay={idx * 0.05} inView>
              <Link href="/create" className="block group">
                <div className="rounded-2xl border border-border bg-background hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  {/* 封面占位区 */}
                  <div
                    className={cn(
                      "aspect-[4/3] relative overflow-hidden",
                      "bg-gradient-to-br",
                      COVER_GRADIENTS[idx % COVER_GRADIENTS.length]
                    )}
                  >
                    {/* Popular 标签 */}
                    {template.popular && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {t("hot")}
                      </div>
                    )}

                    {/* 类型图标 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {template.type === "video" ? (
                        <Video className="h-10 w-10 text-foreground/20" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-foreground/20" />
                      )}
                    </div>

                    {/* 悬停遮罩 */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium text-primary bg-background/90 px-4 py-1.5 rounded-full">
                        {t("useTemplate")}
                      </span>
                    </div>
                  </div>

                  {/* 模板信息 */}
                  <div className="p-4">
                    {(() => {
                      const loc = localizeTemplate(template, tData);
                      return (
                        <>
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <h3 className="font-semibold text-sm text-foreground truncate">
                              {loc.name}
                            </h3>
                            {/* 积分 */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Gem className="h-3 w-3 text-amber-500" />
                              <span className="text-xs text-muted-foreground">{template.credits}</span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                            {loc.description}
                          </p>
                        </>
                      );
                    })()}

                    {/* 标签行 */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          TYPE_COLORS[template.type]
                        )}
                      >
                        {TYPE_LABELS[template.type]}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          CATEGORY_COLORS[template.category]
                        )}
                      >
                        {CATEGORY_LABELS[template.category]}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </BlurFade>
          ))}
        </div>

        {/* 查看全部按钮 */}
        <BlurFade delay={0.4} inView>
          <div className="text-center">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            >
              {t("viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
