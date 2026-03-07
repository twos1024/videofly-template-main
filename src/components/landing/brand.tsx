"use client";

import { LocaleLink } from "@/i18n/navigation";

import { cn } from "@/components/ui";

interface LandingBrandProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  href?: string;
  compact?: boolean;
}

export function LandingBrand({
  className,
  markClassName,
  textClassName,
  href = "/",
  compact = false,
}: LandingBrandProps) {
  return (
    <LocaleLink href={href} className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-emerald-500 font-black text-white shadow-[0_12px_40px_rgba(34,197,94,0.28)]",
          compact ? "h-10 w-10 text-sm" : "h-11 w-11 text-base",
          markClassName
        )}
      >
        VF
      </div>
      <span
        className={cn(
          "font-semibold tracking-tight text-white",
          compact ? "text-lg" : "text-2xl",
          textClassName
        )}
      >
        VideoFly
      </span>
    </LocaleLink>
  );
}
