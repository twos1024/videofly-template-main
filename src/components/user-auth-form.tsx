"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { authClient } from "@/lib/auth/client";
import type { AuthProvidersConfig } from "@/lib/auth/provider-config.types";
import { cn } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import * as Icons from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Dictionary = Record<string, string>;

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  lang: string;
  dict: Dictionary;
  disabled?: boolean;
  authProviders: AuthProvidersConfig;
}

const userAuthSchema = z.object({
  email: z.string().email(),
});

type FormData = z.infer<typeof userAuthSchema>;

export function UserAuthForm({
  className,
  lang,
  dict,
  disabled,
  authProviders,
  ...props
}: UserAuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const searchParams = useSearchParams();
  const defaultNext = `/${lang}/my-creations`;
  const defaultCallbackURL = `/${lang}/post-login?next=${encodeURIComponent(defaultNext)}`;

  async function onSubmit(data: FormData) {
    if (!authProviders.magicLink) {
      toast.error("Email login is not enabled.");
      return;
    }

    setIsLoading(true);

    try {
      await authClient.signIn.magicLink({
        email: data.email.toLowerCase(),
        callbackURL: searchParams?.get("from") ?? defaultCallbackURL,
      });

      toast.success("Check your email", {
        description: "We sent you a login link. Be sure to check your spam too.",
      });
    } catch (error) {
      console.error("Error during sign in:", error);
      toast.error("Something went wrong.", {
        description: "Your sign in request failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {authProviders.magicLink && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading || isGoogleLoading || disabled}
                {...register("email")}
              />
              {errors?.email && (
                <p className="px-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className={cn(buttonVariants())}
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {dict.signin_email}
            </button>
          </div>
        </form>
      )}
      {authProviders.google && authProviders.magicLink && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {dict.signin_others}
            </span>
          </div>
        </div>
      )}
      {authProviders.google && (
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={() => {
            setIsGoogleLoading(true);
            authClient.signIn
              .social({
                provider: "google",
                callbackURL: searchParams?.get("from") ?? defaultCallbackURL,
              })
              .catch((error) => {
                console.error("Google signIn error:", error);
                setIsGoogleLoading(false);
              });
          }}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.Google className="mr-2 h-4 w-4" />
          )}{" "}
          {dict.continue_google || "Continue with Google"}
        </button>
      )}
      {!authProviders.hasAny && (
        <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          No login provider is configured yet. Please contact the site admin.
        </div>
      )}
    </div>
  );
}
