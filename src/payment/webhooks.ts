import type Stripe from "stripe";

import { CreditTransType, SubscriptionPlan, customers, db } from "@/db";
import { eq } from "drizzle-orm";

import { CreditService } from "@/services/credit";
import { stripe } from ".";
import { getSubscriptionPlan } from "./plans";

const creditService = new CreditService();

/**
 * 根据 plan 类型和计费周期返回对应积分数量
 * PRO:      monthly=960,  yearly=11520
 * BUSINESS: monthly=2850, yearly=34200
 * FREE:     monthly=280,  yearly=3360
 */
function getSubscriptionCredits(
  plan: (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan],
  interval: string
): number {
  const isYearly = interval === "year";
  switch (plan) {
    case SubscriptionPlan.PRO:
      return isYearly ? 11520 : 960;
    case SubscriptionPlan.BUSINESS:
      return isYearly ? 34200 : 2850;
    default:
      return isYearly ? 3360 : 280;
  }
}

export async function handleEvent(event: Stripe.DiscriminatedEvent) {
  const session = event.data.object as Stripe.Checkout.Session;
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const { userId } = subscription.metadata;
    if (!userId) {
      throw new Error("Missing user id");
    }
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.authUserId, userId))
      .limit(1);

    if (customer) {
      return await db
        .update(customers)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id,
        })
        .where(eq(customers.id, customer.id));
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const { userId } = subscription.metadata;
    if (!userId) {
      throw new Error("Missing user id");
    }
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.authUserId, userId))
      .limit(1);

    if (customer) {
      const priceId = subscription.items.data[0]?.price.id;
      if (!priceId) {
        return;
      }

      const plan = getSubscriptionPlan(priceId);
      const resolvedPlan = plan || SubscriptionPlan.FREE;

      await db
        .update(customers)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
          plan: resolvedPlan,
        })
        .where(eq(customers.id, customer.id));

      const interval = subscription.items.data[0]?.plan.interval ?? "month";
      const credits = getSubscriptionCredits(resolvedPlan, interval);
      const invoice = event.data.object as Stripe.Invoice;
      const orderNo = `STRIPE_SUB_${invoice.id}`;

      await creditService.recharge({
        userId,
        credits,
        orderNo,
        transType: CreditTransType.SUBSCRIPTION,
        remark: `Stripe subscription payment: ${resolvedPlan} ${interval}ly`,
      });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const updatedSub = event.data.object as Stripe.Subscription;
    const { userId } = updatedSub.metadata;
    if (!userId) {
      throw new Error("Missing user id in subscription metadata");
    }

    const priceId = updatedSub.items.data[0]?.price.id;
    const plan = getSubscriptionPlan(priceId);
    const isCancelling = updatedSub.cancel_at_period_end;
    const customerId =
      typeof updatedSub.customer === "string"
        ? updatedSub.customer
        : updatedSub.customer.id;

    await db
      .update(customers)
      .set({
        plan: plan || SubscriptionPlan.FREE,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        stripeSubscriptionId: updatedSub.id,
        stripeCurrentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
      })
      .where(eq(customers.authUserId, userId));

    console.log(
      `[Stripe] customer.subscription.updated: userId=${userId}, plan=${plan}, cancelling=${isCancelling}`
    );
  }

  if (event.type === "customer.subscription.deleted") {
    const deletedSub = event.data.object as Stripe.Subscription;
    const { userId } = deletedSub.metadata;
    if (!userId) {
      throw new Error("Missing user id in deleted subscription metadata");
    }

    const customerId =
      typeof deletedSub.customer === "string"
        ? deletedSub.customer
        : deletedSub.customer.id;

    await db
      .update(customers)
      .set({
        plan: SubscriptionPlan.FREE,
        stripeCustomerId: customerId,
        stripePriceId: null,
        stripeSubscriptionId: null,
        stripeCurrentPeriodEnd: new Date(),
      })
      .where(eq(customers.authUserId, userId));

    console.log(
      `[Stripe] customer.subscription.deleted: userId=${userId}, subscriptionId=${deletedSub.id}`
    );
  }

  console.log("✅ Stripe Webhook Processed");
}
