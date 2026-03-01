import { LayoutGrid, Edit3, Sparkles, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { BlurFade } from "@/components/magicui/blur-fade";
import { cn } from "@/components/ui";

const STEP_CONFIGS = [
  {
    step: "01",
    icon: LayoutGrid,
    titleKey: "step1Title" as const,
    descKey: "step1Desc" as const,
    detailKey: "step1Detail" as const,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    accentColor: "bg-primary",
  },
  {
    step: "02",
    icon: Edit3,
    titleKey: "step2Title" as const,
    descKey: "step2Desc" as const,
    detailKey: "step2Detail" as const,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-800",
    accentColor: "bg-sky-500",
  },
  {
    step: "03",
    icon: Sparkles,
    titleKey: "step3Title" as const,
    descKey: "step3Desc" as const,
    detailKey: "step3Detail" as const,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    borderColor: "border-violet-200 dark:border-violet-800",
    accentColor: "bg-violet-500",
  },
];

export function FeaturesSection() {
  const t = useTranslations("Features");

  const steps = STEP_CONFIGS.map((config) => ({
    ...config,
    title: t(config.titleKey),
    description: t(config.descKey),
  }));

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container mx-auto px-4">
        {/* 区域标题 */}
        <BlurFade inView>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("titleLine1")}
              <span className="text-primary">{t("titleLine2")}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </BlurFade>

        {/* 步骤卡片 */}
        <div className="relative max-w-5xl mx-auto">
          {/* 桌面端连接线 */}
          <div className="hidden lg:block absolute top-16 left-[calc(33.33%_-_2rem)] right-[calc(33.33%_-_2rem)] h-0.5 bg-gradient-to-r from-primary/30 via-sky-500/30 to-violet-500/30" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <BlurFade key={step.step} delay={idx * 0.12} inView>
                  <div className="relative group">
                    {/* 移动端连接箭头 */}
                    {idx < steps.length - 1 && (
                      <div className="lg:hidden flex justify-center my-4">
                        <ArrowRight className="h-5 w-5 text-muted-foreground/40 rotate-90" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "relative p-6 rounded-2xl border transition-all duration-300",
                        "hover:shadow-lg hover:-translate-y-1",
                        step.bgColor,
                        step.borderColor
                      )}
                    >
                      {/* 步骤编号 */}
                      <div className="flex items-center justify-between mb-5">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                            "bg-white/80 dark:bg-black/20"
                          )}
                        >
                          <Icon className={cn("h-6 w-6", step.color)} />
                        </div>
                        <span
                          className={cn(
                            "text-4xl font-black opacity-15",
                            step.color
                          )}
                        >
                          {step.step}
                        </span>
                      </div>

                      {/* 标题 */}
                      <h3 className="text-xl font-bold mb-3 text-foreground">
                        {step.title}
                      </h3>

                      {/* 描述 */}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>

                      {/* 底部装饰线 */}
                      <div
                        className={cn(
                          "mt-5 h-0.5 rounded-full opacity-40",
                          step.accentColor
                        )}
                      />
                    </div>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>

        {/* 底部提示 */}
        <BlurFade delay={0.5} inView>
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("step3Detail")}</span>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
