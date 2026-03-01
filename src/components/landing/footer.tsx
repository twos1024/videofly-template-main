"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleLink } from "@/i18n/navigation";

export function LandingFooter() {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: t("product"),
      links: [
        { title: t("linkTemplates"), href: "/create" },
        { title: t("linkPricing"), href: "/pricing" },
        { title: t("linkDashboard"), href: "/my-creations" },
      ],
    },
    {
      title: t("legal"),
      links: [
        { title: t("linkPrivacy"), href: "/privacy" },
        { title: t("linkTerms"), href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* 主要内容 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* 品牌列 */}
          <div className="col-span-2 md:col-span-2">
            <LocaleLink
              href="/"
              className="flex items-center gap-2 text-xl font-bold mb-4"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-black">P</span>
              </div>
              <span>PixelMuse</span>
            </LocaleLink>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* 链接列 */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.title}>
                    <LocaleLink
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.title}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 底部栏 */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <p className="text-sm text-muted-foreground">
            {t("copyright", { currentYear })}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with
            <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
            by PixelMuse Team
          </p>
        </div>
      </div>
    </footer>
  );
}
