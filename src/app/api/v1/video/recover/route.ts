import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { getProvider } from "@/ai";
import { ApiError } from "@/lib/api/error";
import { assertConfiguredBearerSecret } from "@/lib/admin-secret";
import { apiSuccess, handleApiError } from "@/lib/api/response";

const manualRecoverSchema = z.object({
  videoUuid: z.string().min(1),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
});

/**
 * 恢复卡住的视频任务
 * GET /api/v1/video/recover
 * Authorization: Bearer $VIDEO_RECOVERY_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    assertConfiguredBearerSecret(
      request.headers.get("authorization"),
      process.env.VIDEO_RECOVERY_SECRET,
      "Video recovery API"
    );

    // 查找所有非完成状态的视频
    const stuckVideos = await db
      .select()
      .from(videos)
      .where(
        or(
          eq(videos.status, "PENDING"),
          eq(videos.status, "GENERATING"),
          eq(videos.status, "UPLOADING")
        )
      )
      .orderBy(desc(videos.createdAt), desc(videos.uuid))
      .limit(20);

    if (stuckVideos.length === 0) {
      return apiSuccess({
        message: "No stuck videos found",
        recovered: 0,
      });
    }

    const results: Array<{
      uuid: string;
      status: string;
      evolinkStatus: string;
      action: string;
      videoUrl?: string;
      thumbnailUrl?: string;
      error?: string;
    }> = [];

    // 检查每个视频的实际状态
    for (const video of stuckVideos) {
      if (!video.externalTaskId) {
        results.push({
          uuid: video.uuid,
          status: video.status,
          evolinkStatus: "no_task_id",
          action: "skipped",
        });
        continue;
      }

      try {
        // 从 evolink 获取状态
        const provider = getProvider(
          (video.provider as "evolink" | "kie") || "evolink"
        );
        const taskStatus = await provider.getTaskStatus(video.externalTaskId);

        if (taskStatus.status === "completed" && taskStatus.videoUrl) {
          results.push({
            uuid: video.uuid,
            status: video.status,
            evolinkStatus: taskStatus.status,
            action: "ready_to_complete",
            videoUrl: taskStatus.videoUrl,
            thumbnailUrl: taskStatus.thumbnailUrl,
          });
        } else if (taskStatus.status === "failed") {
          results.push({
            uuid: video.uuid,
            status: video.status,
            evolinkStatus: "failed",
            action: "mark_as_failed",
          });
        } else {
          results.push({
            uuid: video.uuid,
            status: video.status,
            evolinkStatus: taskStatus.status || "unknown",
            action: "still_processing",
          });
        }
      } catch (error) {
        results.push({
          uuid: video.uuid,
          status: video.status,
          evolinkStatus: "error",
          action: "query_failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return apiSuccess({
      total: stuckVideos.length,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 手动触发视频完成
 * POST /api/v1/video/recover
 * Authorization: Bearer $VIDEO_RECOVERY_SECRET
 * Body: { videoUuid, videoUrl, thumbnailUrl }
 */
export async function POST(request: NextRequest) {
  try {
    assertConfiguredBearerSecret(
      request.headers.get("authorization"),
      process.env.VIDEO_RECOVERY_SECRET,
      "Video recovery API"
    );

    const body = manualRecoverSchema.parse(await request.json());
    const { videoUuid, videoUrl, thumbnailUrl } = body;

    // 获取视频信息
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, videoUuid))
      .limit(1);

    if (!video) {
      throw new ApiError("Video not found", 404);
    }

    // 手动触发完成流程
    const { videoService } = await import("@/services/video");
    await videoService.manualCompleteGeneration(videoUuid, {
      taskId: video.externalTaskId || `manual_${Date.now()}`,
      provider: (video.provider as "evolink" | "kie") || "evolink",
      status: "completed",
      progress: 100,
      videoUrl,
      thumbnailUrl,
    });

    return apiSuccess({
      message: "Video recovered successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
