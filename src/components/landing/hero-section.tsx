"use client";

import { LocaleLink as Link } from "@/i18n/navigation";
import { ShoppingBag, Share2, Briefcase, Palette, ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { BlurFade } from "@/components/magicui/blur-fade";
import { GridPattern } from "@/components/magicui/grid-pattern";
import { cn } from "@/components/ui";

const SCENE_CATEGORY_CONFIGS = [
  {
    icon: ShoppingBag,
    titleKey: "categoryEcommerce" as const,
    descKey: "categoryEcommerceDesc" as const,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    icon: Share2,
    titleKey: "categorySocial" as const,
    descKey: "categorySocialDesc" as const,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
  },
  {
    icon: Briefcase,
    titleKey: "categoryBusiness" as const,
    descKey: "categoryBusinessDesc" as const,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  {
    icon: Palette,
    titleKey: "categoryPersonal" as const,
    descKey: "categoryPersonalDesc" as const,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200 dark:border-rose-800",
  },
];

export function HeroSection() {
  const t = useTranslations("Hero");

  return (
    <section className="relative min-h-[90vh] overflow-hidden flex items-center">
      {/* 背景渐变 */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_hsl(var(--primary)/0.15),_transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_100%,_hsl(var(--primary)/0.08),_transparent)]" />
      </div>

      {/* 网格背景 */}
      <GridPattern
        width={40}
        height={40}
        className={cn(
          "-z-10 opacity-40",
          "[mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,black,transparent)]"
        )}
      />

      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="flex flex-col items-center gap-12">
          {/* 顶部徽章 */}
          <BlurFade delay={0.05} inView>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("badge")}</span>
            </div>
          </BlurFade>

          {/* 主标题 */}
          <BlurFade delay={0.1} inView>
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-center max-w-4xl leading-[1.1]">
              {t("titleLine1")}
              <span className="text-primary">{t("titleLine2")}</span>
            </h1>
          </BlurFade>

          {/* 副标题 */}
          <BlurFade delay={0.2} inView>
            <p className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl leading-relaxed">
              {t("description")}
            </p>
          </BlurFade>

          {/* CTA 按钮 */}
          <BlurFade delay={0.3} inView>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                {t("startCreating")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-sm text-muted-foreground">{t("creditsHint")}</p>
            </div>
          </BlurFade>

          {/* 场景分类卡片 */}
          <BlurFade delay={0.4} inView>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
              {SCENE_CATEGORY_CONFIGS.map((category, idx) => {
                const Icon = category.icon;
                const title = t(category.titleKey);
                return (
                  <BlurFade key={category.titleKey} delay={0.45 + idx * 0.08} inView>
                    <Link href="/create" className="block group">
                      <div
                        className={cn(
                          "p-4 rounded-2xl border transition-all duration-300",
                          "hover:shadow-md hover:-translate-y-0.5",
                          category.bgColor,
                          category.borderColor
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                            "bg-white/80 dark:bg-black/20"
                          )}
                        >
                          <Icon className={cn("h-5 w-5", category.color)} />
                        </div>
                        <h3 className="font-semibold text-sm text-foreground mb-1">
                          {title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t(category.descKey)}
                        </p>
                      </div>
                    </Link>
                  </BlurFade>
                );
              })}
            </div>
          </BlurFade>

          {/* 底部数据 */}
          <BlurFade delay={0.7} inView>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>{t("stat1")}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{t("stat2")}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{t("stat3")}</span>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
