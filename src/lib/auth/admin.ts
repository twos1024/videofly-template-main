/**
 * ============================================
 * 管理员权限检查
 * ============================================
 *
 * 检查用户是否具有管理员权限
 * 用于保护管理后台页面
 *
 * 支持自动设置管理员：
 * 如果用户邮箱匹配 ADMIN_EMAIL 环境变量，
 * 会自动将其设置为管理员
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveAdminStatus } from "./admin-role";
import { getSessionSafe } from "./session";
import type { Locale } from "@/config/i18n-config";

/**
 * 要求用户具有管理员权限
 *
 * 如果用户邮箱匹配 ADMIN_EMAIL，会自动设置为管理员
 *
 * @param redirectTo - 未授权时重定向的路径
 * @returns 当前用户信息
 * @throws 如果未登录或不是管理员，则重定向
 */
export async function requireAdmin(redirectTo?: string) {
  const session = await getSessionSafe(await headers());

  if (!session?.user) {
    redirect(redirectTo || "/login");
  }

  const isAdmin = await resolveAdminStatus(session.user);
  if (!isAdmin) {
    redirect(redirectTo || "/");
  }

  return {
    ...session.user,
    isAdmin,
  };
}

/**
 * 检查用户是否是管理员
 *
 * @returns 是否是管理员
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSessionSafe(await headers());

  return !!session?.user?.isAdmin;
}

/**
 * 为给定路径生成本地化的登录重定向路径
 */
export function getLoginRedirect(locale: Locale = "en"): string {
  return `/${locale}/login`;
}
