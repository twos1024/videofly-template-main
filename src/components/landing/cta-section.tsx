"use client";

import { LocaleLink as Link } from "@/i18n/navigation";
import { Check, Star, ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { BlurFade } from "@/components/magicui/blur-fade";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AvatarCircles } from "@/components/magicui/avatar-circles";
import { cn } from "@/components/ui";

const AVATAR_URLS = [
  { imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=1", profileUrl: "#" },
  { imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=2", profileUrl: "#" },
  { imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=3", profileUrl: "#" },
  { imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=4", profileUrl: "#" },
];

export function CTASection() {
  const t = useTranslations("CTA");

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
    t("benefit4"),
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/20 via-background to-background" />

      <div className="container mx-auto px-4">
        <div className="relative max-w-5xl mx-auto">
          <BlurFade inView>
            {/* 主 CTA 卡片 */}
            <div className="relative rounded-3xl border border-border bg-background/80 backdrop-blur-sm overflow-hidden shadow-2xl">
              <BorderBeam
                size={400}
                duration={12}
                anchor={90}
                borderWidth={1.5}
                colorFrom="var(--primary)"
                colorTo="color-mix(in oklch, var(--primary) 30%, transparent)"
              />

              {/* 顶部装饰条 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

              {/* 背景光晕 */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="grid md:grid-cols-2 gap-10 p-8 md:p-12 relative">
                {/* 左侧内容 */}
                <div className="space-y-6">
                  {/* 徽章 */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{t("badge")}</span>
                  </div>

                  {/* 标题 */}
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                    {t("titleLine1")}
                    <span className="text-primary">{t("titleLine2")}</span>
                  </h2>

                  {/* 副标题 */}
                  <p className="text-lg text-muted-foreground">
                    {t("description")}
                  </p>

                  {/* 优势列表 */}
                  <ul className="space-y-3">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA 按钮 */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                      {t("getStarted")}
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>

                  {/* 社交证明 */}
                  <div className="flex items-center gap-4 pt-2">
                    <AvatarCircles
                      numPeople={12000}
                      avatarUrls={AVATAR_URLS}
                      className="justify-start"
                    />
                    <div className="text-sm">
                      <div className="flex items-center gap-0.5 mb-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground">
                        {t("rating")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 右侧：亮点展示 */}
                <div className="flex flex-col justify-center gap-4">
                  {[
                    { num: t("highlight1Num"), label: t("highlight1Label"), desc: t("highlight1Desc") },
                    { num: t("highlight2Num"), label: t("highlight2Label"), desc: t("highlight2Desc") },
                    { num: t("highlight3Num"), label: t("highlight3Label"), desc: t("highlight3Desc") },
                  ].map((item) => (
                    <div
                      key={item.num}
                      className={cn(
                        "p-5 rounded-2xl border border-border/60 bg-muted/30",
                        "hover:border-primary/30 hover:bg-primary/5 transition-colors duration-300"
                      )}
                    >
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-3xl font-black text-primary">{item.num}</span>
                        <span className="font-semibold text-foreground">{item.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
