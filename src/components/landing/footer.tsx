"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

import { LandingBrand } from "@/components/landing/brand";
import { LocaleLink } from "@/i18n/navigation";

export function LandingFooter() {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: t("product"),
      links: [
        { title: t("linkTemplates"), href: "/create/video" },
        { title: t("linkPricing"), href: "/pricing" },
        { title: t("linkDashboard"), href: "/my-creations" },
      ],
    },
    {
      title: t("legal"),
      links: [
        { title: t("linkPrivacy"), href: "/privacy-policy" },
        { title: t("linkTerms"), href: "/terms-of-service" },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/8 bg-[#020805] text-white">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="max-w-md">
            <LandingBrand />
            <p className="mt-5 text-sm leading-7 text-white/55">{t("tagline")}</p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/40">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.title}>
                    <LocaleLink
                      href={link.href}
                      className="text-sm text-white/62 transition hover:text-white"
                    >
                      {link.title}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-8 text-sm text-white/42 md:flex-row md:items-center md:justify-between">
          <p>{t("copyright", { currentYear })}</p>
          <p className="flex items-center gap-1.5">
            {t.rich("madeWith", {
              heart: () => <Heart className="h-4 w-4 fill-emerald-400 text-emerald-400" />,
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}
