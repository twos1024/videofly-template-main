import { NextRequest } from "next/server";

import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { db } from "@/db";
import { creditPackages } from "@/db/schema";
import { eq, and, lt, desc } from "drizzle-orm";
import type { CreditTransType } from "@/db/schema";
import { CREDIT_PACKAGES, SUBSCRIPTION_PRODUCTS } from "@/config/pricing-user";

/**
 * GET /api/v1/user/billing
 *
 * Get user's purchase history (credit packages)
 * Query params:
 * - limit: number of items per page (default: 20)
 * - cursor: pagination cursor (creditPackages.id)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const limit = Math.min(Math.max(1, Number.parseInt(searchParams.get("limit") || "20")), 100);
    const cursor = searchParams.get("cursor");

    // Get ORDER_PAY type value
    const orderPayType: CreditTransType = "ORDER_PAY";

    // Build query using Drizzle ORM
    const conditions = [
      eq(creditPackages.userId, user.id),
      eq(creditPackages.transType, orderPayType),
    ];
    if (cursor) {
      conditions.push(lt(creditPackages.id, Number.parseInt(cursor)));
    }

    const packages = await db
      .select({
        id: creditPackages.id,
        userId: creditPackages.userId,
        initialCredits: creditPackages.initialCredits,
        remainingCredits: creditPackages.remainingCredits,
        transType: creditPackages.transType,
        orderNo: creditPackages.orderNo,
        status: creditPackages.status,
        expiredAt: creditPackages.expiredAt,
        createdAt: creditPackages.createdAt,
      })
      .from(creditPackages)
      .where(and(...conditions))
      .orderBy(desc(creditPackages.createdAt))
      .limit(limit + 1);

    // Check if there's more data
    const hasMore = packages.length > limit;
    const results = hasMore ? packages.slice(0, limit) : packages;

    // Get next cursor
    const nextCursor = hasMore && results.length > 0
      ? String(results[results.length - 1].id)
      : null;

    // Build credits-to-price lookup from config
    const creditsPriceMap = new Map<number, number>();
    for (const pkg of CREDIT_PACKAGES) {
      creditsPriceMap.set(pkg.credits, pkg.priceUsd);
    }
    for (const sub of SUBSCRIPTION_PRODUCTS) {
      creditsPriceMap.set(sub.credits, sub.priceUsd);
    }

    // Transform to invoice format
    const invoices = results.map((pkg) => {
      const initialCredits = pkg.initialCredits;
      const itemDescription = `${initialCredits} Credits`;

      // Look up actual price from config, fallback to estimate
      const amount = creditsPriceMap.get(initialCredits) ?? initialCredits * 0.05;

      return {
        id: String(pkg.id),
        amount,
        currency: "USD",
        status: pkg.status.toLowerCase(),
        items: [
          {
            type: "credits",
            description: itemDescription,
            quantity: initialCredits,
          },
        ],
        createdAt: pkg.createdAt,
      };
    });

    return apiSuccess({
      user: {
        email: user.email,
        id: user.id,
        createdAt: user.createdAt,
      },
      invoices,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
