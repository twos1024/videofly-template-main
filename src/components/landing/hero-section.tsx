"use client";

import { Play, Sparkles, WandSparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { BlurFade } from "@/components/magicui/blur-fade";
import { Meteors } from "@/components/magicui/meteors";
import { HeroPromptStudio } from "@/components/landing/hero-prompt-studio";
import { cn } from "@/components/ui";

const HERO_FEATURES = [
  { key: "speed", icon: Zap },
  { key: "ease", icon: Play },
  { key: "ai", icon: WandSparkles },
] as const;

export function HeroSection() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden bg-[#010805] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(19,157,77,0.24),transparent_28%),radial-gradient(circle_at_20%_30%,rgba(10,72,43,0.4),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(8,59,35,0.24),transparent_24%),linear-gradient(180deg,#020804_0%,#021009_44%,#020805_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(29,185,84,0.06),transparent)] opacity-60" />
      <Meteors
        number={14}
        minDelay={0.4}
        maxDelay={1.8}
        minDuration={5}
        maxDuration={12}
        angle={202}
        className="bg-white/45"
      />

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />

      <div className="container relative mx-auto px-4 pb-20 pt-24 md:pb-28 md:pt-32">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
          <BlurFade delay={0.05} inView>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/18 bg-emerald-500/10 px-5 py-2.5 text-sm text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.08)] backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              <span>{t("badge")}</span>
            </div>
          </BlurFade>

          <BlurFade delay={0.12} inView>
            <h1 className="max-w-5xl text-balance text-5xl font-semibold tracking-tight text-white drop-shadow-[0_6px_22px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl lg:text-[5.6rem] lg:leading-[0.96]">
              {t("title")}
            </h1>
          </BlurFade>

          <BlurFade delay={0.18} inView>
            <p className="max-w-4xl text-balance text-lg leading-8 text-white/62 md:text-[1.75rem] md:leading-[1.65]">
              {t("description")}
            </p>
          </BlurFade>

          <BlurFade delay={0.24} inView>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {HERO_FEATURES.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm backdrop-blur-xl md:text-base",
                    "border-white/10 bg-white/[0.06] text-white/78 shadow-[0_12px_36px_rgba(0,0,0,0.18)]"
                  )}
                >
                  <Icon className="h-4 w-4 text-emerald-300" />
                  <span>{t(`featurePills.${key}`)}</span>
                </div>
              ))}
            </div>
          </BlurFade>

          <BlurFade delay={0.32} inView className="w-full">
            <HeroPromptStudio />
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
