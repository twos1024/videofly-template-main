import { redirect } from "next/navigation";
import type { Locale } from "@/config/i18n-config";
import { getCurrentUser } from "@/lib/auth";
import { resolveAdminStatus } from "@/lib/auth/admin-role";

interface PostLoginPageProps {
  params: Promise<{
    locale: Locale;
  }>;
  searchParams?: Promise<{
    next?: string;
  }>;
}

const isSafeInternalPath = (path: string): boolean => {
  return path.startsWith("/") && !path.startsWith("//");
};

export default async function PostLoginPage({
  params,
  searchParams,
}: PostLoginPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const defaultNext = `/${locale}/my-creations`;
  const nextFromQuery = resolvedSearchParams?.next;
  const nextPath = nextFromQuery && isSafeInternalPath(nextFromQuery)
    ? nextFromQuery
    : defaultNext;

  const isAdmin = await resolveAdminStatus(user);
  if (isAdmin) {
    redirect(`/${locale}/admin`);
  }

  redirect(nextPath);
}
