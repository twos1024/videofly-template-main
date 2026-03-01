import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { creem } from "@creem_io/better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import "@/lib/proxy-config";

import {
  CreditTransType,
  creditService,
} from "@/services/credit";
import {
  getProductById,
  getProductExpiryDays,
} from "@/config/credits";

import { creditPackages, db, users } from "@/db";
import * as schema from "@/db/schema";
import { env } from "./env.mjs";
import { eq } from "drizzle-orm";

const toLogString = (value: unknown) => {
  if (value === null || value === undefined) return String(value);
  if (typeof value === "string") return value;
  const maybeObject = (v: unknown): Record<string, unknown> =>
    typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  const normalized =
    value instanceof Error
      ? {
        name: value.name,
        message: value.message,
        stack: value.stack,
        code: maybeObject(value).code,
        status: maybeObject(value).status,
        statusText: maybeObject(value).statusText,
        error: maybeObject(value).error,
        cause: maybeObject(value).cause,
      }
      : value;
  const seen = new WeakSet();
  try {
    return JSON.stringify(normalized, (_key, val) => {
      if (typeof val === "bigint") return val.toString();
      if (typeof val === "function") return "[Function]";
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    });
  } catch {
    return String(normalized);
  }
};

const debugLogger =
  process.env.NODE_ENV === "development"
    ? {
      level: "debug" as const,
      log: (level: "debug" | "info" | "warn" | "error", message: string, ...args: unknown[]) => {
        const serializedArgs = args.map(toLogString);
        const suffix = serializedArgs.length ? ` ${serializedArgs.join(" ")}` : "";
        const line = `[Better Auth] ${message}${suffix}`.trimEnd();

        const isTransientDbError =
          level === "error" &&
          serializedArgs.some((entry) => {
            const lower = entry.toLowerCase();
            return (
              lower.includes("econnreset") ||
              lower.includes("etimedout") ||
              lower.includes("eai_again") ||
              lower.includes("connect_timeout")
            );
          });

        if (isTransientDbError) console.warn(line);
        else if (level === "error") console.error(line);
        else if (level === "warn") console.warn(line);
        else console.log(line);
      },
    }
    : undefined;

const isLocalHost = (value: string) => {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
};

const buildTrustedOrigins = (request?: Request) => {
  const trusted = new Set<string>();

  const addOrigin = (value?: string) => {
    if (!value) return;
    try {
      trusted.add(new URL(value).origin);
    } catch {
      // Ignore invalid URLs from env
    }
  };

  addOrigin(env.NEXT_PUBLIC_APP_URL);
  addOrigin(process.env.BETTER_AUTH_BASE_URL);

  if (process.env.NODE_ENV === "development") {
    const originHeader = request?.headers.get("origin");
    const refererHeader = request?.headers.get("referer");
    const requestOrigin = request?.url ? new URL(request.url).origin : undefined;

    if (originHeader && isLocalHost(originHeader)) {
      addOrigin(originHeader);
    }

    if (refererHeader && isLocalHost(refererHeader)) {
      addOrigin(refererHeader);
    }

    if (requestOrigin && isLocalHost(requestOrigin)) {
      addOrigin(requestOrigin);
    }

    addOrigin("http://localhost:3000");
    addOrigin("http://127.0.0.1:3000");
  }

  return Array.from(trusted);
};

const authBaseURL =
  process.env.BETTER_AUTH_BASE_URL || env.NEXT_PUBLIC_APP_URL;

type AuthPlugin =
  | ReturnType<typeof nextCookies>
  | ReturnType<typeof magicLink>
  | ReturnType<typeof creem>;

const plugins: AuthPlugin[] = [
  // Avoid Next.js dev DataCloneError from cookies() in some environments.
  ...(process.env.NODE_ENV === "development" ? [] : [nextCookies()]),
  magicLink({
    sendMagicLink: async ({ email, url }) => {
      // Dynamic import to avoid Edge Runtime issues in middleware
      const { MagicLinkEmail } = await import(
        "@/lib/emails/magic-link-email"
      );
      const { resend } = await import("@/lib/email");
      const { siteConfig } = await import("@/config/site");

      // Check if user exists to determine email type
      const [existingUser] = await db
        .select({ name: users.name, emailVerified: users.emailVerified })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const userVerified = !!existingUser?.emailVerified;
      const authSubject = userVerified
        ? `Sign-in link for ${(siteConfig as { name: string }).name}`
        : "Activate your account";

      try {
        await resend.emails.send({
          from: env.RESEND_FROM,
          to: email,
          subject: authSubject,
          react: MagicLinkEmail({
            firstName: existingUser?.name ?? "",
            actionUrl: url,
            mailType: userVerified ? "login" : "register",
            siteName: (siteConfig as { name: string }).name,
          }),
          headers: {
            "X-Entity-Ref-ID": new Date().getTime() + "",
          },
        });
      } catch (error) {
        console.error("Failed to send magic link email:", error);
        throw error;
      }
    },
    expiresIn: 300, // 5 minutes
  }),
];

if (env.CREEM_API_KEY) {
  plugins.push(
    creem({
      apiKey: env.CREEM_API_KEY,
      webhookSecret: env.CREEM_WEBHOOK_SECRET,
      testMode: process.env.NODE_ENV !== "production",
      persistSubscriptions: true,
      defaultSuccessUrl: "/dashboard",

      onGrantAccess: async ({ product, customer, metadata }) => {
        console.log(`[Creem] onGrantAccess called`, {
          productId: product?.id,
          productName: product?.name,
          metadata,
        });

        const productConfig = getProductById(product.id);
        if (!productConfig) {
          console.error(`[Creem] Unknown product: ${product.id}`);
          return;
        }

        const credits = productConfig.credits;
        if (credits <= 0) return;

        // 从 metadata 获取用户 ID（Creem 插件在 checkout 时自动设置 referenceId）
        const meta = (metadata ?? {}) as Record<string, unknown>;
        const userId = meta.referenceId as string | undefined;

        if (!userId) {
          console.error(`[Creem] No referenceId in metadata, cannot process subscription`);
          return;
        }

        // 获取订阅 ID 用于防止重复处理
        const subscriptionId =
          typeof meta.subscriptionId === "string"
            ? meta.subscriptionId
            : (customer as { id?: string })?.id;

        const orderNo = subscriptionId
          ? `creem_sub_${subscriptionId}`
          : `creem_${productConfig.type}_${userId}_${Date.now()}`;

        const [existing] = await db
          .select({ id: creditPackages.id })
          .from(creditPackages)
          .where(eq(creditPackages.orderNo, orderNo))
          .limit(1);

        if (existing) {
          console.log(`[Creem] Duplicate webhook ignored: ${orderNo}`);
          return;
        }

        const transType =
          productConfig.type === "subscription"
            ? CreditTransType.SUBSCRIPTION
            : CreditTransType.ORDER_PAY;

        const productName = product?.name ?? productConfig.id;

        console.log(`[Creem] Processing subscription: ${productName}, credits: ${credits}, userId: ${userId}`);

        await creditService.recharge({
          userId,
          credits,
          orderNo,
          transType,
          expiryDays: getProductExpiryDays(productConfig),
          remark: `Creem payment: ${productName}`,
        });

        console.log(`[Creem] Subscription processed: ${orderNo}`);
      },

      onRevokeAccess: async ({ customer, product }) => {
        console.log("Creem access revoked:", { customer, product });
      },

      // 处理一次性购买（checkout.completed 事件不触发 onGrantAccess）
      onCheckoutCompleted: async (checkoutData) => {
        // 只处理一次性购买（onetime）
        // billing_type 可能是 "onetime" 或 "one-time" 取决于 API 版本
        const productType = checkoutData.product?.billing_type as string;
        if (productType !== "onetime" && productType !== "one-time") {
          console.log(`[Creem] Skipping checkout.completed for subscription product`);
          return;
        }

        const product = checkoutData.product;
        const productConfig = getProductById(product.id);
        if (!productConfig) {
          console.error(`[Creem] Unknown product in checkout: ${product.id}`);
          return;
        }

        const credits = productConfig.credits;
        if (credits <= 0) return;

        // 从 metadata 获取用户 ID
        const referenceId = checkoutData.metadata?.referenceId as string | undefined;
        if (!referenceId) {
          console.error(`[Creem] No referenceId in checkout metadata`);
          return;
        }

        // 使用 order ID 作为唯一标识
        const orderId = typeof checkoutData.order === "object"
          ? checkoutData.order?.id
          : checkoutData.order;
        const orderNo = orderId
          ? `creem_${orderId}`
          : `creem_onetime_${referenceId}_${Date.now()}`;

        // 防止重复处理
        const [existing] = await db
          .select({ id: creditPackages.id })
          .from(creditPackages)
          .where(eq(creditPackages.orderNo, orderNo))
          .limit(1);

        if (existing) {
          console.log(`[Creem] Duplicate checkout ignored: ${orderNo}`);
          return;
        }

        const productName = product?.name ?? productConfig.id;

        console.log(`[Creem] Processing one-time purchase: ${productName}, credits: ${credits}, userId: ${referenceId}`);

        await creditService.recharge({
          userId: referenceId,
          credits,
          orderNo,
          transType: CreditTransType.ORDER_PAY,
          expiryDays: getProductExpiryDays(productConfig),
          remark: `Creem payment: ${productName}`,
        });

        console.log(`[Creem] One-time purchase completed: ${orderNo}`);
      },
    })
  );
}

export const auth = betterAuth({
  baseURL: authBaseURL,
  basePath: "/api/auth",
  trustedOrigins: async (request) => buildTrustedOrigins(request),
  secret: env.BETTER_AUTH_SECRET,
  logger: debugLogger,
  account: {
    // Avoid DB writes during OAuth state init; helps when DB has transient issues.
    storeStateStrategy: "cookie",
  },

  // Drizzle adapter with schema for Better Auth
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  // Plugins
  plugins,

  // Hooks - 自动赠送新用户积分（仅在注册时触发）
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // 只要有新 session 创建（注册或登录），都尝试检查并发放新用户积分
      // grantNewUserCredits 内部有幂等性检查，只会发放一次
      // 这样可以覆盖 Email 注册、OAuth 注册等所有场景
      const newSession = ctx.context?.newSession;
      if (newSession?.user?.id) {
        try {
          // 不等待这个操作，避免阻塞登录/注册响应（虽然它是异步的，但 await 会阻塞中间件链）
          // 但作为 after hook，最好还是 await 确保执行完成，反正数据库查询很快
          await creditService.grantNewUserCredits(newSession.user.id);
        } catch (error) {
          console.error("[Auth] Failed to grant new user credits:", error);
          // 不抛出错误，避免影响用户登录
        }
      }
    }),
  },

  // Google OAuth
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account", // Always show account picker
    },
  },

  // Custom user fields
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // Prevent users from setting this
      },
    },
  },

  // Session configuration
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});

// Extend user type with additional fields
export type User = typeof auth.$Infer.Session.user & {
  isAdmin?: boolean | null;
};

// Session type with extended user
type BaseSession = typeof auth.$Infer.Session;
export type Session = {
  session: BaseSession["session"];
  user: User;
};
