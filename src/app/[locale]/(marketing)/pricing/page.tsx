import { getCurrentUser } from "@/lib/auth";

import { PricingCards } from "@/components/price/pricing-cards";
import { FAQSection } from "@/components/landing/faq-section";
import type { UserSubscriptionPlan } from "@/types";
import type { Locale } from "@/config/i18n-config";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const alternates = buildAlternates("/pricing", locale);

  return {
    title: "Pricing",
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
  };
}

export default async function PricingPage() {
  const user = await getCurrentUser();
  let subscriptionPlan: UserSubscriptionPlan | undefined;

  if (user) {
    const { getUserPlans } = await import("@/services/billing");
    subscriptionPlan = await getUserPlans(user.id);
  }

  return (
    <div className="flex w-full flex-col gap-0">
      <PricingCards
        userId={user?.id}
        subscriptionPlan={subscriptionPlan}
      />
      <FAQSection />
    </div>
  );
}
