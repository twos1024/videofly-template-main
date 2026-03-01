import { db } from "@/db";
import { users, videos, creditPackages, VideoStatus } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { withDbRetry } from "@/lib/db/retry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users as UsersIcon,
  Video,
  Coins,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from "@/components/ui/icons";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations("Admin");
  const stats = await withDbRetry(async () => {
    const [
      totalUsersResult,
      totalVideosResult,
      totalCreditPackagesResult,
      completedVideosResult,
      failedVideosResult,
      pendingVideosResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(videos),
      db.select({ count: count() }).from(creditPackages),
      db.select({ count: count() }).from(videos).where(eq(videos.status, VideoStatus.COMPLETED)),
      db.select({ count: count() }).from(videos).where(eq(videos.status, VideoStatus.FAILED)),
      db.select({ count: count() }).from(videos).where(eq(videos.status, VideoStatus.PENDING)),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    const [recentUsersResult, recentVideosResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(users)
        .where(sql`${users.createdAt} >= ${sevenDaysAgoStr}::timestamp`),
      db
        .select({ count: count() })
        .from(videos)
        .where(sql`${videos.createdAt} >= ${sevenDaysAgoStr}::timestamp`),
    ]);

    const totalUsers = totalUsersResult[0]?.count || 0;
    const totalVideos = totalVideosResult[0]?.count || 0;
    const totalCreditPackages = totalCreditPackagesResult[0]?.count || 0;
    const completedVideos = completedVideosResult[0]?.count || 0;
    const failedVideos = failedVideosResult[0]?.count || 0;
    const pendingVideos = pendingVideosResult[0]?.count || 0;
    const recentUsers = recentUsersResult[0]?.count || 0;
    const recentVideos = recentVideosResult[0]?.count || 0;

    return {
      totalUsers,
      totalVideos,
      totalCreditPackages,
      completedVideos,
      failedVideos,
      pendingVideos,
      recentUsers,
      recentVideos,
    };
  }).catch((error) => {
    console.warn("[Admin] Failed to load dashboard stats, fallback to zero values", error);
    return {
      totalUsers: 0,
      totalVideos: 0,
      totalCreditPackages: 0,
      completedVideos: 0,
      failedVideos: 0,
      pendingVideos: 0,
      recentUsers: 0,
      recentVideos: 0,
    };
  });

  const totalFinishedVideos = stats.completedVideos + stats.failedVideos;
  const successRate = totalFinishedVideos > 0
    ? (stats.completedVideos / totalFinishedVideos) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalUsers")}
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.last7days", { count: stats.recentUsers })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalVideos")}
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVideos}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.last7days", { count: stats.recentVideos })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.successRate")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.completedOf", { completed: stats.completedVideos, total: totalFinishedVideos })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.creditPackages")}
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreditPackages}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.allUsers")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Video Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.completed")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedVideos}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.ofTotal", { percent: stats.totalVideos > 0 ? ((stats.completedVideos / stats.totalVideos) * 100).toFixed(1) : 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.failed")}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedVideos}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.ofTotal", { percent: stats.totalVideos > 0 ? ((stats.failedVideos / stats.totalVideos) * 100).toFixed(1) : 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.processing")}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingVideos}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.ofTotal", { percent: stats.totalVideos > 0 ? ((stats.pendingVideos / stats.totalVideos) * 100).toFixed(1) : 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          <CardDescription>
            {t("dashboard.quickActionsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <a
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <UsersIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{t("dashboard.userManagement")}</div>
              <div className="text-sm text-muted-foreground">{t("dashboard.userManagementDesc")}</div>
            </div>
          </a>

          <a
            href="/admin/analytics"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{t("dashboard.dataAnalytics")}</div>
              <div className="text-sm text-muted-foreground">{t("dashboard.dataAnalyticsDesc")}</div>
            </div>
          </a>

          <a
            href="/admin/settings"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <Coins className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">{t("dashboard.creditConfig")}</div>
              <div className="text-sm text-muted-foreground">{t("dashboard.creditConfigDesc")}</div>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
