import { VideoStatus, db, videos } from "@/db";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";
import { getModelConfig, calculateModelCredits } from "../config/credits";
import { getProvider, type ProviderType, type VideoTaskResponse } from "../ai";
import { creditService } from "./credit";
import { generateSignedCallbackUrl } from "@/ai/utils/callback-signature";
import { ApiError } from "@/lib/api/error";
import { emitVideoEvent } from "@/lib/video-events";
import { assertRemoteAssetDownloadConfigured } from "@/lib/media-validation";
import {
  decodeCompositeCursor,
  encodeCompositeCursor,
} from "@/lib/pagination-cursor";

export interface GenerateVideoParams {
  userId: string;
  prompt: string;
  model: string; // "sora-2"
  duration?: number;
  aspectRatio?: string; // "16:9" | "9:16"
  quality?: string; // "standard" | "high"
  imageUrl?: string; // image-to-video
  imageUrls?: string[]; // image-to-video (multi-image)
  mode?: string;
  outputNumber?: number;
  generateAudio?: boolean;
}

export interface VideoGenerationResult {
  videoUuid: string;
  taskId: string;
  provider: ProviderType;
  status: string;
  estimatedTime?: number;
  creditsUsed: number;
}

async function emitVideoEventSafely(
  event: Parameters<typeof emitVideoEvent>[0]
): Promise<void> {
  try {
    await emitVideoEvent(event);
  } catch (error) {
    console.error("Failed to emit video event:", error);
  }
}

export class VideoService {
  private callbackBaseUrl: string;

  constructor() {
    this.callbackBaseUrl = process.env.AI_CALLBACK_URL || "";
  }

  /**
   * Create video generation task
   */
  async generate(params: GenerateVideoParams): Promise<VideoGenerationResult> {
    const modelConfig = getModelConfig(params.model);
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${params.model}`);
    }

    assertRemoteAssetDownloadConfigured();

    const effectiveDuration = params.duration || modelConfig.durations[0] || 5;

    const outputNumber = Math.max(1, params.outputNumber ?? 1);
    const creditsRequired = calculateModelCredits(params.model, {
      duration: effectiveDuration,
      quality: params.quality,
    }) * outputNumber;

    const hasImageInput =
      (params.imageUrls && params.imageUrls.length > 0) || Boolean(params.imageUrl);

    if (hasImageInput && !modelConfig.supportImageToVideo) {
      throw new Error(`Model ${params.model} does not support image-to-video`);
    }

    const selectedProvider =
      (process.env.DEFAULT_AI_PROVIDER as ProviderType) || modelConfig.provider;
    const videoUuid = `vid_${nanoid(21)}`;

    const [videoResult] = await db
      .insert(videos)
      .values({
        uuid: videoUuid,
        userId: params.userId,
        prompt: params.prompt,
        model: params.model,
        parameters: {
          duration: params.duration,
          aspectRatio: params.aspectRatio,
          quality: params.quality,
          outputNumber,
          mode: params.mode,
          imageUrl: params.imageUrl,
          imageUrls: params.imageUrls,
          generateAudio: params.generateAudio,
        },
        status: VideoStatus.PENDING,
        startImageUrl: params.imageUrls?.[0] || params.imageUrl || null,
        creditsUsed: creditsRequired,
        duration: effectiveDuration,
        aspectRatio: params.aspectRatio || null,
        provider: selectedProvider,
        updatedAt: new Date(),
      })
      .returning({ uuid: videos.uuid, id: videos.id });

    if (!videoResult) {
      throw new Error("Failed to create video record");
    }

    let freezeResult: { success: boolean; holdId: number };
    try {
      freezeResult = await creditService.freeze({
        userId: params.userId,
        credits: creditsRequired,
        videoUuid: videoResult.uuid,
      });
    } catch (error) {
      await db
        .update(videos)
        .set({
          status: VideoStatus.FAILED,
          errorMessage: String(error),
          updatedAt: new Date(),
        })
        .where(eq(videos.uuid, videoResult.uuid));
      throw error;
    }

    if (!freezeResult.success) {
      await db
        .update(videos)
        .set({
          status: VideoStatus.FAILED,
          errorMessage: `Insufficient credits. Required: ${creditsRequired}`,
          updatedAt: new Date(),
        })
        .where(eq(videos.uuid, videoResult.uuid));
      throw new Error(`Insufficient credits. Required: ${creditsRequired}`);
    }

    const callbackUrl = this.callbackBaseUrl
      ? generateSignedCallbackUrl(
        `${this.callbackBaseUrl}/${selectedProvider}`,
        videoResult.uuid
      )
      : undefined;

    try {
      const provider = getProvider(selectedProvider);
      const result = await provider.createTask({
        model: params.model,
        prompt: params.prompt,
        duration: effectiveDuration,
        aspectRatio: params.aspectRatio,
        quality: params.quality,
        imageUrl: params.imageUrl,
        imageUrls: params.imageUrls,
        mode: params.mode,
        outputNumber,
        generateAudio: params.generateAudio,
        callbackUrl,
      });

      await db
        .update(videos)
        .set({
          status: VideoStatus.GENERATING,
          externalTaskId: result.taskId,
          updatedAt: new Date(),
        })
        .where(eq(videos.uuid, videoResult.uuid));

      return {
        videoUuid: videoResult.uuid,
        taskId: result.taskId,
        provider: selectedProvider,
        status: "GENERATING",
        estimatedTime: result.estimatedTime,
        creditsUsed: creditsRequired,
      };
    } catch (error) {
      await creditService.release(videoResult.uuid);

      await db
        .update(videos)
        .set({
          status: VideoStatus.FAILED,
          errorMessage: String(error),
          updatedAt: new Date(),
        })
        .where(eq(videos.uuid, videoResult.uuid));
      throw error;
    }
  }

  /**
   * Handle AI Callback
   */
  async handleCallback(
    providerType: ProviderType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    videoUuid: string
  ): Promise<void> {
    const provider = getProvider(providerType);
    const result = provider.parseCallback(payload);

    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, videoUuid))
      .limit(1);

    if (!video) {
      console.error(`Video not found: ${videoUuid}`);
      return;
    }

    if (video.externalTaskId && video.externalTaskId !== result.taskId) {
      console.error(
        `Task ID mismatch: expected ${video.externalTaskId}, got ${result.taskId}`
      );
      return;
    }

    if (result.status === "completed" && result.videoUrl) {
      await this.tryCompleteGeneration(video.uuid, result);
    } else if (result.status === "failed") {
      await this.tryFailGeneration(video.uuid, result.error?.message);
    }
  }

  /**
   * Get task status (for frontend polling)
   */
  async refreshStatus(
    videoUuid: string,
    userId: string
  ): Promise<{
    status: string;
    videoUrl?: string;
    error?: string;
  }> {
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.uuid, videoUuid), eq(videos.userId, userId)))
      .limit(1);

    if (!video) {
      throw new Error("Video not found");
    }

    if (video.status === VideoStatus.COMPLETED || video.status === VideoStatus.FAILED) {
      return {
        status: video.status,
        videoUrl: video.videoUrl || undefined,
        error: video.errorMessage || undefined,
      };
    }

    if (video.externalTaskId && video.provider) {
      try {
        const provider = getProvider(video.provider as ProviderType);
        const result = await provider.getTaskStatus(video.externalTaskId);

        if (result.status === "completed" && result.videoUrl) {
          const updated = await this.tryCompleteGeneration(video.uuid, result);
          return {
            status: updated.status,
            videoUrl: updated.videoUrl || undefined,
          };
        }

        if (result.status === "failed") {
          const updated = await this.tryFailGeneration(
            video.uuid,
            result.error?.message
          );
          return {
            status: updated.status,
            videoUrl: updated.videoUrl || undefined,
            error: updated.errorMessage || undefined,
          };
        }
        if (result.status === "processing" && video.status === VideoStatus.PENDING) {
          await db
            .update(videos)
            .set({
              status: VideoStatus.GENERATING,
              updatedAt: new Date(),
            })
            .where(eq(videos.uuid, video.uuid));
          return { status: VideoStatus.GENERATING };
        }
      } catch (error) {
        console.error("Failed to refresh status from provider:", error);
      }
    }

    return { status: video.status };
  }

  /**
   * Refresh status by external task id
   */
  async refreshStatusByTaskId(taskId: string, userId: string) {
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.externalTaskId, taskId), eq(videos.userId, userId)))
      .limit(1);

    if (!video) {
      throw new Error("Video not found");
    }

    return this.refreshStatus(video.uuid, userId);
  }

  async manualCompleteGeneration(
    videoUuid: string,
    result: VideoTaskResponse
  ): Promise<{ status: string; videoUrl?: string | null }> {
    return this.tryCompleteGeneration(videoUuid, result);
  }

  /**
   * Try to complete generation (transaction + optimistic lock)
   */
  private async tryCompleteGeneration(
    videoUuid: string,
    result: VideoTaskResponse
  ): Promise<{ status: string; videoUrl?: string | null }> {
    if (!result.videoUrl) {
      throw new Error("Missing video URL in completion result");
    }

    assertRemoteAssetDownloadConfigured();

    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, videoUuid))
      .limit(1);

    if (!video) {
      throw new Error("Video not found");
    }

    if (video.status === VideoStatus.COMPLETED) {
      return { status: video.status, videoUrl: video.videoUrl };
    }

    if (video.status === VideoStatus.FAILED) {
      return { status: video.status, videoUrl: null };
    }

    if (
      video.status !== VideoStatus.GENERATING &&
      video.status !== VideoStatus.UPLOADING &&
      video.status !== VideoStatus.PENDING
    ) {
      return { status: video.status, videoUrl: video.videoUrl };
    }

    if (video.status !== VideoStatus.UPLOADING) {
      await db
        .update(videos)
        .set({
          status: VideoStatus.UPLOADING,
          originalVideoUrl: result.videoUrl,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(videos.uuid, videoUuid),
            or(
              eq(videos.status, VideoStatus.GENERATING),
              eq(videos.status, VideoStatus.PENDING),
              eq(videos.status, VideoStatus.UPLOADING)
            )
          )
        );
    }

    let uploaded: { url: string; key: string; size: number };
    try {
      const storage = getStorage();
      const keyPrefix = `videos/${videoUuid}/${Date.now()}`;
      uploaded = await storage.downloadAndUpload({
        sourceUrl: result.videoUrl,
        keyPrefix,
        kind: "video",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? `Video upload failed: ${error.message}`
          : "Video upload failed";
      await this.tryFailGeneration(videoUuid, message);
      return { status: VideoStatus.FAILED, videoUrl: null };
    }

    const finalized = await db.transaction(async (trx) => {
      const [latest] = await trx
        .select()
        .from(videos)
        .where(eq(videos.uuid, videoUuid))
        .limit(1);

      if (!latest) {
        throw new Error("Video not found");
      }

      if (latest.status === VideoStatus.COMPLETED) {
        return {
          status: latest.status,
          videoUrl: latest.videoUrl,
          shouldEmit: false,
          userId: latest.userId,
        };
      }

      if (latest.status === VideoStatus.FAILED) {
        return {
          status: latest.status,
          videoUrl: null,
          shouldEmit: false,
          userId: latest.userId,
        };
      }

      const holdResult = await creditService.settleInTx(trx, videoUuid);
      if (holdResult.status === "RELEASED") {
        const [current] = await trx
          .select({
            status: videos.status,
            videoUrl: videos.videoUrl,
          })
          .from(videos)
          .where(eq(videos.uuid, videoUuid))
          .limit(1);

        return {
          status: current?.status || VideoStatus.FAILED,
          videoUrl: current?.videoUrl || null,
          shouldEmit: false,
          userId: latest.userId,
        };
      }

      await trx
        .update(videos)
        .set({
          status: VideoStatus.COMPLETED,
          videoUrl: uploaded.url,
          fileSize: uploaded.size,
          thumbnailUrl: result.thumbnailUrl || null,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(videos.uuid, videoUuid));

      return {
        status: VideoStatus.COMPLETED,
        videoUrl: uploaded.url,
        shouldEmit: true,
        userId: latest.userId,
      };
    });

    if (finalized.shouldEmit) {
      await emitVideoEventSafely({
        userId: finalized.userId,
        videoUuid,
        status: "COMPLETED",
        videoUrl: finalized.videoUrl || undefined,
        thumbnailUrl: result.thumbnailUrl || null,
      });
    }

    return { status: finalized.status, videoUrl: finalized.videoUrl };
  }

  /**
   * Try to mark as failed (transaction + optimistic lock)
   */
  private async tryFailGeneration(
    videoUuid: string,
    errorMessage?: string
  ): Promise<{
    status: string;
    errorMessage?: string | null;
    videoUrl?: string | null;
  }> {
    const failedMessage = errorMessage || "Generation failed";

    const finalized = await db.transaction(async (trx) => {
      const [video] = await trx
        .select()
        .from(videos)
        .where(eq(videos.uuid, videoUuid))
        .limit(1);

      if (!video) {
        throw new Error("Video not found");
      }

      if (video.status === VideoStatus.COMPLETED || video.status === VideoStatus.FAILED) {
        return {
          status: video.status,
          errorMessage: video.errorMessage,
          videoUrl: video.videoUrl,
          shouldEmit: false,
          userId: video.userId,
        };
      }

      const holdResult = await creditService.releaseInTx(trx, videoUuid);
      if (holdResult.status === "SETTLED") {
        const [current] = await trx
          .select({
            status: videos.status,
            errorMessage: videos.errorMessage,
            videoUrl: videos.videoUrl,
          })
          .from(videos)
          .where(eq(videos.uuid, videoUuid))
          .limit(1);

        return {
          status: current?.status || VideoStatus.COMPLETED,
          errorMessage: current?.errorMessage,
          videoUrl: current?.videoUrl || null,
          shouldEmit: false,
          userId: video.userId,
        };
      }

      await trx
        .update(videos)
        .set({
          status: VideoStatus.FAILED,
          errorMessage: failedMessage,
          updatedAt: new Date(),
        })
        .where(eq(videos.uuid, videoUuid));

      return {
        status: VideoStatus.FAILED,
        errorMessage: failedMessage,
        videoUrl: null,
        shouldEmit: true,
        userId: video.userId,
      };
    });

    if (finalized.shouldEmit) {
      await emitVideoEventSafely({
        userId: finalized.userId,
        videoUuid,
        status: "FAILED",
        error: finalized.errorMessage || failedMessage,
      });
    }

    return {
      status: finalized.status,
      errorMessage: finalized.errorMessage,
      videoUrl: finalized.videoUrl,
    };
  }

  /**
   * Get video details
   */
  async getVideo(uuid: string, userId: string) {
    const [video] = await db
      .select()
      .from(videos)
      .where(
        and(
          eq(videos.uuid, uuid),
          eq(videos.userId, userId),
          eq(videos.isDeleted, false)
        )
      )
      .limit(1);
    return video ?? null;
  }

  /**
   * Get user video list
   */
  async listVideos(
    userId: string,
    options?: {
      limit?: number;
      cursor?: string;
      status?: string;
    }
  ) {
    const limit = options?.limit || 20;

    const conditions = [
      eq(videos.userId, userId),
      eq(videos.isDeleted, false),
    ];

    if (options?.status) {
      conditions.push(eq(videos.status, options.status as typeof VideoStatus[keyof typeof VideoStatus]));
    }

    if (options?.cursor) {
      let cursor = null;

      try {
        cursor = decodeCompositeCursor(options.cursor);
      } catch {
        const [legacyCursor] = await db
          .select({ createdAt: videos.createdAt, uuid: videos.uuid })
          .from(videos)
          .where(eq(videos.uuid, options.cursor))
          .limit(1);

        cursor = legacyCursor ?? null;
      }

      if (!cursor) {
        throw new ApiError("Invalid cursor", 400);
      }

      const cursorCondition = or(
        lt(videos.createdAt, cursor.createdAt),
        and(eq(videos.createdAt, cursor.createdAt), lt(videos.uuid, cursor.uuid))
      );
      if (cursorCondition) {
        conditions.push(cursorCondition);
      }
    }

    const list = await db
      .select()
      .from(videos)
      .where(and(...conditions))
      .orderBy(desc(videos.createdAt), desc(videos.uuid))
      .limit(limit + 1);

    const hasMore = list.length > limit;
    if (hasMore) list.pop();

    return {
      videos: list,
      nextCursor:
        hasMore && list.length > 0
          ? encodeCompositeCursor({
              createdAt: list[list.length - 1].createdAt,
              uuid: list[list.length - 1].uuid,
            })
          : null,
      hasMore,
    };
  }

  /**
   * Delete video (soft delete)
   */
  async deleteVideo(uuid: string, userId: string): Promise<void> {
    await db
      .update(videos)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(videos.uuid, uuid), eq(videos.userId, userId)));
  }
}

export const videoService = new VideoService();
