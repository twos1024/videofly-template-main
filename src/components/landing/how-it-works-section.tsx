"use client";

import { Store, BookOpen, Rss, Clock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { BlurFade } from "@/components/magicui/blur-fade";
import { cn } from "@/components/ui";

const CASES = [
  {
    icon: Store,
    badgeKey: "case1Badge" as const,
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    titleKey: "case1Title" as const,
    descKey: "case1Desc" as const,
    templateKey: "case1Template" as const,
    statKey: "case1Stat" as const,
    statColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200/50 dark:border-emerald-800/50",
  },
  {
    icon: BookOpen,
    badgeKey: "case2Badge" as const,
    badgeColor: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    iconBg: "bg-sky-100 dark:bg-sky-900/40",
    iconColor: "text-sky-600 dark:text-sky-400",
    titleKey: "case2Title" as const,
    descKey: "case2Desc" as const,
    templateKey: "case2Template" as const,
    statKey: "case2Stat" as const,
    statColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-200/50 dark:border-sky-800/50",
  },
  {
    icon: Rss,
    badgeKey: "case3Badge" as const,
    badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    titleKey: "case3Title" as const,
    descKey: "case3Desc" as const,
    templateKey: "case3Template" as const,
    statKey: "case3Stat" as const,
    statColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-200/50 dark:border-violet-800/50",
  },
];

export function HowItWorks() {
  const t = useTranslations("HowItWorks");

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container mx-auto px-4">
        {/* 区域标题 */}
        <BlurFade inView>
          <div className="text-center max-w-3xl mx-auto mb-16">
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

        {/* 案例卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {CASES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <BlurFade key={item.titleKey} delay={idx * 0.1} inView>
                <div
                  className={cn(
                    "relative p-6 rounded-2xl border bg-background",
                    "hover:shadow-lg hover:-translate-y-1 transition-all duration-300",
                    item.borderColor
                  )}
                >
                  {/* 顶部：图标 + 分类标签 */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        item.iconBg
                      )}
                    >
                      <Icon className={cn("h-6 w-6", item.iconColor)} />
                    </div>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        item.badgeColor
                      )}
                    >
                      {t(item.badgeKey)}
                    </span>
                  </div>

                  {/* 标题 */}
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {t(item.titleKey)}
                  </h3>

                  {/* 描述 */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {t(item.descKey)}
                  </p>

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{t("usingTemplate")}</span>
                      <span className="text-xs font-medium text-foreground">
                        {t(item.templateKey)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className={cn("h-3.5 w-3.5", item.statColor)} />
                      <span className={cn("text-xs font-semibold", item.statColor)}>
                        {t(item.statKey)}
                      </span>
                    </div>
                  </div>
                </div>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
