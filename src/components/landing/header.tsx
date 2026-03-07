"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronDown, Gem, Globe, Menu, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { LandingBrand } from "@/components/landing/brand";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSigninModal } from "@/hooks/use-signin-modal";
import { authClient } from "@/lib/auth/client";
import type { User } from "@/lib/auth/client";
import { useLocalePathname, useLocaleRouter, LocaleLink } from "@/i18n/navigation";
import { useCredits } from "@/stores/credits-store";

export function LandingHeader({ user }: { user?: User | null }) {
  const t = useTranslations("Header");
  const tCommon = useTranslations("Common");
  const tNav = useTranslations("UserAccountNav");
  const signInModal = useSigninModal();
  const locale = useLocale();
  const pathname = useLocalePathname();
  const router = useLocaleRouter();
  const [, startTransition] = useTransition();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      router.push(pathname, { locale: newLocale });
    });
  };

  const chromeClass = scrolled
    ? "border-white/8 bg-[#030c07]/82 shadow-[0_14px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
    : "border-transparent bg-transparent";
  const navItemClass = cn(
    "inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition",
    scrolled
      ? "text-foreground/88 hover:bg-white/6 hover:text-foreground"
      : "text-white/78 hover:bg-white/6 hover:text-white"
  );

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 md:px-5">
      <div className={cn("mx-auto max-w-7xl rounded-full border transition-all duration-300", chromeClass)}>
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <LandingBrand compact className="shrink-0" />

          <nav className="hidden items-center gap-2 lg:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={navItemClass}>
                  <span>{t("templates")}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-72 rounded-3xl border border-white/10 bg-[#07110a]/95 p-2 text-white shadow-2xl backdrop-blur-xl"
              >
                <DropdownMenuItem asChild className="cursor-pointer rounded-2xl px-3 py-3 focus:bg-white/10 focus:text-white">
                  <LocaleLink href="/create/video" className="flex flex-col items-start gap-1">
                    <span className="font-medium">{t("textToVideo")}</span>
                    <span className="text-xs text-white/50">{t("textToVideoDesc")}</span>
                  </LocaleLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <LocaleLink href="/pricing" className={navItemClass}>
              {t("pricing")}
            </LocaleLink>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm transition",
                    scrolled
                      ? "text-foreground/72 hover:bg-white/6 hover:text-foreground"
                      : "text-white/72 hover:bg-white/6 hover:text-white"
                  )}
                >
                  <Globe className="h-4 w-4" />
                  <span>{locale.toUpperCase()}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-2xl border border-white/10 bg-[#07110a]/95 text-white shadow-xl backdrop-blur-xl"
              >
                <DropdownMenuItem
                  onClick={() => switchLocale("en")}
                  className="cursor-pointer rounded-xl px-3 py-2 focus:bg-white/10 focus:text-white"
                >
                  {t("langEn")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchLocale("zh")}
                  className="cursor-pointer rounded-xl px-3 py-2 focus:bg-white/10 focus:text-white"
                >
                  {t("langZh")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="[&_button]:h-11 [&_button]:w-11 [&_button]:rounded-full [&_button]:border [&_button]:border-white/10 [&_button]:bg-transparent [&_button]:text-white/72 [&_button]:hover:bg-white/6 [&_svg]:!h-4 [&_svg]:!w-4">
              <ModeToggle />
            </div>

            {user && (
              <div className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/82">
                <Gem className="h-4 w-4 text-emerald-300" />
                <CreditsDisplay />
              </div>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                  >
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 rounded-3xl border border-white/10 bg-[#07110a]/95 p-2 text-white shadow-2xl backdrop-blur-xl"
                >
                  <DropdownMenuItem asChild className="cursor-pointer rounded-2xl px-3 py-2 focus:bg-white/10 focus:text-white">
                    <LocaleLink href="/my-creations">{t("myCreations")}</LocaleLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-2xl px-3 py-2 focus:bg-white/10 focus:text-white">
                    <LocaleLink href="/credits">{t("credits")}</LocaleLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-2xl px-3 py-2 focus:bg-white/10 focus:text-white">
                    <LocaleLink href="/settings">{t("settings")}</LocaleLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2 bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-2xl px-3 py-2 text-red-300 focus:bg-red-500/10 focus:text-red-200"
                  >
                    {tNav("sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={signInModal.onOpen}
                className="h-12 rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-black shadow-[0_14px_40px_rgba(34,197,94,0.32)] hover:bg-emerald-400"
              >
                {tCommon("login")}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {user && (
              <div className="inline-flex h-9 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/82">
                <Gem className="h-3.5 w-3.5 text-emerald-300" />
                <CreditsDisplay />
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/85"
                  aria-label={t("openMenu")}
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent className="border-white/10 bg-[#041009] text-white">
                <SheetHeader>
                  <SheetTitle>
                    <LandingBrand compact textClassName="text-white" />
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    {t("openMenu")}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-8 flex flex-col gap-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-2">
                    <div className="mb-2 px-3 text-xs uppercase tracking-[0.24em] text-white/35">
                      {t("templates")}
                    </div>
                    <LocaleLink
                      href="/create/video"
                      className="flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium text-white/88 transition hover:bg-white/8"
                    >
                      <Sparkles className="h-4 w-4 text-emerald-300" />
                      <div className="flex flex-col">
                        <span>{t("textToVideo")}</span>
                        <span className="text-xs text-white/45">{t("textToVideoDesc")}</span>
                      </div>
                    </LocaleLink>
                  </div>

                  <LocaleLink
                    href="/pricing"
                    className="rounded-full px-4 py-3 text-sm font-medium text-white/78 transition hover:bg-white/6 hover:text-white"
                  >
                    {t("pricing")}
                  </LocaleLink>
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-3">
                  <Globe className="h-4 w-4 text-white/48" />
                  <button type="button" onClick={() => switchLocale("en")} className="text-sm text-white/72">
                    {t("langEn")}
                  </button>
                  <span className="text-white/25">/</span>
                  <button type="button" onClick={() => switchLocale("zh")} className="text-sm text-white/72">
                    {t("langZh")}
                  </button>
                  <div className="ml-auto [&_button]:h-9 [&_button]:w-9 [&_button]:rounded-full [&_button]:border [&_button]:border-white/10 [&_button]:bg-transparent [&_button]:text-white/70 [&_button]:hover:bg-white/6 [&_svg]:!h-4 [&_svg]:!w-4">
                    <ModeToggle />
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-6">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <LocaleLink href="/my-creations" className="rounded-full px-4 py-3 text-sm text-white/80 transition hover:bg-white/6 hover:text-white">
                        {t("myCreations")}
                      </LocaleLink>
                      <LocaleLink href="/credits" className="rounded-full px-4 py-3 text-sm text-white/80 transition hover:bg-white/6 hover:text-white">
                        {t("credits")}
                      </LocaleLink>
                      <LocaleLink href="/settings" className="rounded-full px-4 py-3 text-sm text-white/80 transition hover:bg-white/6 hover:text-white">
                        {t("settings")}
                      </LocaleLink>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="rounded-full px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                      >
                        {tNav("sign_out")}
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={signInModal.onOpen}
                      className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400"
                    >
                      {tCommon("login")}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

function CreditsDisplay() {
  const { balance } = useCredits();
  return <span>{balance?.availableCredits ?? 0}</span>;
}
