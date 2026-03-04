"use client";

import { useState, useEffect, useTransition } from "react";
import { Menu, Globe, Gem, LayoutGrid, Tag } from "lucide-react";
import { useLocalePathname, useLocaleRouter, LocaleLink } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/components/ui";
import { useCredits } from "@/stores/credits-store";
import type { User } from "@/lib/auth/client";
import { useSigninModal } from "@/hooks/use-signin-modal";
import { authClient } from "@/lib/auth/client";

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

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      router.push(pathname, { locale: newLocale });
    });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/50"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        {/* 桌面导航 */}
        <nav className="hidden lg:flex items-center justify-between h-16">
          {/* Logo */}
          <LocaleLink
            href="/"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-black">P</span>
            </div>
            <span>PixelMuse</span>
          </LocaleLink>

          {/* 中间导航 */}
          <div className="flex items-center gap-1">
            <LocaleLink
              href="/create"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LayoutGrid className="h-4 w-4" />
              {t("templates")}
            </LocaleLink>
            <LocaleLink
              href="/pricing"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Tag className="h-4 w-4" />
              {t("pricing")}
            </LocaleLink>
          </div>

          {/* 右侧区域 */}
          <div className="flex items-center gap-4">
            {/* 语言切换 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">{locale.toUpperCase()}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[120px] border-border/50 bg-background/95 backdrop-blur-sm shadow-xl"
              >
                <DropdownMenuItem
                  onClick={() => switchLocale("en")}
                  className="cursor-pointer hover:bg-accent"
                >
                  {t("langEn")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchLocale("zh")}
                  className="cursor-pointer hover:bg-accent"
                >
                  {t("langZh")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 积分显示 */}
            {user && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
                <Gem className="h-4 w-4 text-amber-500" />
                <CreditsDisplay />
              </div>
            )}

            {/* 用户菜单 */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background/20">
                      <span className="text-sm font-medium">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 border-border/50 bg-background/95 backdrop-blur-sm shadow-xl"
                >
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent">
                    <LocaleLink href="/my-creations">{t("myCreations")}</LocaleLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent">
                    <LocaleLink href="/credits">{t("credits")}</LocaleLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent">
                    <LocaleLink href="/settings">{t("settings")}</LocaleLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    {tNav("sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={signInModal.onOpen}>
                {tCommon("login")}
              </Button>
            )}
          </div>
        </nav>

        {/* 移动端导航 */}
        <div className="lg:hidden flex items-center justify-between h-16">
          {/* Logo */}
          <LocaleLink href="/" className="flex items-center gap-2 text-lg font-bold">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-black">P</span>
            </div>
            <span>PixelMuse</span>
          </LocaleLink>

          {/* 移动端右侧 */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted border border-border">
                <Gem className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-medium">
                  <CreditsDisplay />
                </span>
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <LocaleLink href="/" className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-black">P</span>
                      </div>
                      PixelMuse
                    </LocaleLink>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Mobile navigation menu
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-8 flex flex-col gap-2">
                  <LocaleLink
                    href="/create"
                    className="flex items-center gap-2 font-semibold p-3 hover:bg-accent rounded-md transition-colors"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    {t("templates")}
                  </LocaleLink>
                  <LocaleLink
                    href="/pricing"
                    className="flex items-center gap-2 font-semibold p-3 hover:bg-accent rounded-md transition-colors"
                  >
                    <Tag className="h-4 w-4" />
                    {t("pricing")}
                  </LocaleLink>

                  {/* 语言切换 */}
                  <div className="flex items-center gap-3 p-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => switchLocale("en")}
                      className="text-sm hover:text-foreground transition-colors text-muted-foreground"
                    >
                      {t("langEn")}
                    </button>
                    <span className="text-muted-foreground">/</span>
                    <button
                      type="button"
                      onClick={() => switchLocale("zh")}
                      className="text-sm hover:text-foreground transition-colors text-muted-foreground"
                    >
                      {t("langZh")}
                    </button>
                  </div>
                </div>

                {/* 账户区域 */}
                <div className="border-t pt-4 mt-4">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <LocaleLink
                        href="/my-creations"
                        className="p-2 hover:bg-accent rounded-md transition-colors"
                      >
                        {t("myCreations")}
                      </LocaleLink>
                      <LocaleLink
                        href="/credits"
                        className="p-2 hover:bg-accent rounded-md transition-colors"
                      >
                        {t("credits")}
                      </LocaleLink>
                      <LocaleLink
                        href="/settings"
                        className="p-2 hover:bg-accent rounded-md transition-colors"
                      >
                        {t("settings")}
                      </LocaleLink>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="p-2 text-left text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        {tNav("sign_out")}
                      </button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={signInModal.onOpen}>
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
