"use client";

// ============================================
// Buy Credits Button Component
// ============================================

import { useTranslations } from "next-intl";
import Link from "next/link";

interface BuyCreditsButtonProps {
  locale: string;
}

export function BuyCreditsButton({ locale }: BuyCreditsButtonProps) {
  const t = useTranslations("dashboard.credits");

  return (
    <Link
      href={`/${locale}/pricing`}
      className="block w-full rounded-lg bg-primary px-4 py-3 text-center font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {t("buyCredits")}
    </Link>
  );
}
