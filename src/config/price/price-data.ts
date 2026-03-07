import type { SubscriptionPlan } from "@/types";

export interface SubscriptionPlanTranslation extends SubscriptionPlan {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  limitations: string[];
  prices: {
    monthly: number;
    yearly: number;
  };
  stripeIds: {
    monthly: string | null;
    yearly: string | null;
  };
  popular?: boolean;
}

const priceDataEn: SubscriptionPlanTranslation[] = [
  {
    id: "pro",
    title: "Pro",
    description: "For solo creators shipping videos every week",
    benefits: [
      "960 credits every month",
      "720P and 1080P video exports",
      "Faster generation queue",
      "No watermark",
      "Commercial usage rights",
    ],
    limitations: ["No API access"],
    prices: {
      monthly: 29.9,
      yearly: 299,
    },
    stripeIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? null,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID ?? null,
    },
    popular: true,
  },
  {
    id: "business",
    title: "Business",
    description: "For teams running AI video at production volume",
    benefits: [
      "2,850 credits every month",
      "720P and 1080P video exports",
      "Fastest generation queue",
      "No watermark",
      "Commercial usage rights",
      "Priority support",
      "API access",
    ],
    limitations: [],
    prices: {
      monthly: 79.9,
      yearly: 799,
    },
    stripeIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? null,
      yearly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID ?? null,
    },
  },
];

const priceDataZh: SubscriptionPlanTranslation[] = [
  {
    id: "pro",
    title: "Pro",
    description: "适合稳定产出视频的个人创作者",
    benefits: [
      "每月 960 积分",
      "支持 720P / 1080P 视频导出",
      "更快的生成队列",
      "无水印",
      "可商用",
    ],
    limitations: ["不含 API 访问权限"],
    prices: {
      monthly: 29.9,
      yearly: 299,
    },
    stripeIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? null,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID ?? null,
    },
    popular: true,
  },
  {
    id: "business",
    title: "Business",
    description: "适合团队和高频视频生产场景",
    benefits: [
      "每月 2,850 积分",
      "支持 720P / 1080P 视频导出",
      "最快生成队列",
      "无水印",
      "可商用",
      "优先支持",
      "开放 API 访问",
    ],
    limitations: [],
    prices: {
      monthly: 79.9,
      yearly: 799,
    },
    stripeIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? null,
      yearly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID ?? null,
    },
  },
];

export const priceDataMap: Record<string, SubscriptionPlanTranslation[]> = {
  zh: priceDataZh,
  en: priceDataEn,
};
