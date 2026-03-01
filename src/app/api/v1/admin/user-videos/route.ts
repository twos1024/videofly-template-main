import { NextRequest } from "next/server";
import { getUserVideos, getUserVideoStats } from "@/lib/admin/user-videos";
import { requireAdmin } from "@/lib/api/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const page = Number.parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status");

    if (!userId) {
      return apiError("Missing userId parameter", 400);
    }

    // 并行获取视频列表和统计信息
    const [videosData, stats] = await Promise.all([
      getUserVideos({
        userId,
        page,
        limit: 10,
        status: status && status !== "all" ? (status as any) : undefined,
      }),
      getUserVideoStats(userId),
    ]);

    return apiSuccess({
      videos: videosData.videos,
      totalVideos: videosData.totalVideos,
      totalPages: videosData.totalPages,
      stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
