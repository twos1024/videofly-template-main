"use client";

import { useTranslations } from "next-intl";
import { StatCard } from "./stat-card";
import {
  Users as UsersIcon,
  Rocket,
  Video,
  TrendingUp,
  Billing,
  BarChart3,
  CheckCircle,
  User,
} from "@/components/ui/icons";

interface Stats {
  totalUsers: number;
  totalOrders: number;
  paidOrders: number;
  totalVideos: number;
  firstVideoConversionRate: number;
  paymentConversionRate: number;
  videoSuccessRate: number;
  usersWithoutVideos: number;
}

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations("Admin");

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("analytics.totalUsers")}
        value={stats.totalUsers.toLocaleString()}
        description={t("analytics.registeredUsers")}
        icon={UsersIcon}
      />

      <StatCard
        title={t("analytics.totalOrders")}
        value={stats.totalOrders.toLocaleString()}
        description={t("analytics.allOrders")}
        icon={Rocket}
      />

      <StatCard
        title={t("analytics.paidOrders")}
        value={stats.paidOrders.toLocaleString()}
        description={t("analytics.paidOrdersDesc")}
        icon={Billing}
      />

      <StatCard
        title={t("analytics.totalVideos")}
        value={stats.totalVideos.toLocaleString()}
        description={t("analytics.totalVideosDesc")}
        icon={Video}
      />

      <StatCard
        title={t("analytics.firstVideoConversion")}
        value={`${stats.firstVideoConversionRate}%`}
        description={t("analytics.firstVideoConversionDesc")}
        icon={TrendingUp}
        valueClassName="text-purple-600"
      />

      <StatCard
        title={t("analytics.paymentConversion")}
        value={`${stats.paymentConversionRate}%`}
        description={t("analytics.paymentConversionDesc")}
        icon={Billing}
        valueClassName="text-green-600"
      />

      <StatCard
        title={t("analytics.videoSuccessRate")}
        value={`${stats.videoSuccessRate}%`}
        description={t("analytics.videoSuccessRateDesc")}
        icon={CheckCircle}
        iconClassName="text-green-600"
        valueClassName="text-green-600"
      />

      <StatCard
        title={t("analytics.usersWithoutVideos")}
        value={stats.usersWithoutVideos.toLocaleString()}
        description={t("analytics.usersWithoutVideosDesc")}
        icon={User}
      />
    </div>
  );
}
