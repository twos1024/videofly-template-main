import { db } from "@/db";
import { images } from "@/db/schema";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";
import { getProvider, type ProviderType } from "@/ai";
import type { VideoTaskResponse } from "@/ai/types";
import { ApiError } from "@/lib/api/error";
import { assertRemoteAssetDownloadConfigured } from "@/lib/media-validation";
import { creditService } from "./credit";
import { generateSignedCallbackUrl } from "@/ai/utils/callback-signature";
import {
  decodeCompositeCursor,
  encodeCompositeCursor,
} from "@/lib/pagination-cursor";
import {
  calculateImageCredits,
  getImageModelConfig,
} from "@/config/credits";
import { resolvePublicCallbackBaseUrl } from "@/lib/env/callback-url";

// ImageStatus mirrors VideoStatus — schema already defines imageStatusEnum
export const ImageStatus = {
  PENDING: "PENDING",
  GENERATING: "GENERATING",
  UPLOADING: "UPLOADING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type ImageStatus = (typeof ImageStatus)[keyof typeof ImageStatus];

export interface GenerateImageParams {
  userId: string;
  prompt: string;
  model: string;
  aspectRatio?: string;
  quality?: string;
  style?: string;
  templateId?: string;
}

export interface ImageGenerationResult {
  imageUuid: string;
  taskId: string;
  provider: string;
  status: string;
  creditsUsed: number;
}

export class ImageService {
  private callbackBaseUrl: string;

  constructor() {
    this.callbackBaseUrl =
      resolvePublicCallbackBaseUrl({
        callbackUrl: process.env.AI_CALLBACK_URL?.replace(
          "/video/callback",
          "/image/callback"
        ),
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
        callbackPath: "/api/v1/image/callback",
      }) || "";
  }

  async generate(params: GenerateImageParams): Promise<ImageGenerationResult> {
    const modelConfig = getImageModelConfig(params.model);
    if (!modelConfig) {
      throw new Error(`Unsupported image model: ${params.model}`);
    }

    assertRemoteAssetDownloadConfigured();

    const creditsRequired = calculateImageCredits(params.model);
    if (creditsRequired <= 0) {
      throw new Error(`Invalid image credit configuration for model: ${params.model}`);
    }

    const imageUuid = `img_${nanoid(21)}`;

    const [imageResult] = await db
      .insert(images)
      .values({
        uuid: imageUuid,
        userId: params.userId,
        prompt: params.prompt,
        model: params.model,
        parameters: {
          aspectRatio: params.aspectRatio,
          quality: params.quality,
          style: params.style,
        },
        status: "PENDING",
        creditsUsed: creditsRequired,
        aspectRatio: params.aspectRatio || null,
        templateId: params.templateId || null,
        updatedAt: new Date(),
      })
      .returning({ uuid: images.uuid, id: images.id });

    if (!imageResult) {
      throw new Error("Failed to create image record");
    }

    let freezeResult: { success: boolean; holdId: number };
    try {
      // creditHolds.videoUuid is reused as the generic asset identifier
      freezeResult = await creditService.freeze({
        userId: params.userId,
        credits: creditsRequired,
        videoUuid: imageResult.uuid,
      });
    } catch (error) {
      await db
        .update(images)
        .set({
          status: "FAILED",
          errorMessage: String(error),
          updatedAt: new Date(),
        })
        .where(eq(images.uuid, imageResult.uuid));
      throw error;
    }

    if (!freezeResult.success) {
      await db
        .update(images)
        .set({
          status: "FAILED",
          errorMessage: `Insufficient credits. Required: ${creditsRequired}`,
          updatedAt: new Date(),
        })
        .where(eq(images.uuid, imageResult.uuid));
      throw new Error(`Insufficient credits. Required: ${creditsRequired}`);
    }

    const providerType =
      (modelConfig.provider as ProviderType | undefined) ||
      ((process.env.DEFAULT_AI_PROVIDER as ProviderType) || "kie");
    const provider = getProvider(providerType);

    let callbackUrl: string | undefined;
    if (this.callbackBaseUrl) {
      try {
        callbackUrl = generateSignedCallbackUrl(
          `${this.callbackBaseUrl}/${providerType}`,
          imageResult.uuid
        );
      } catch (error) {
        console.warn(
          "Failed to generate signed image callback URL. Falling back to polling-only mode:",
          error
        );
      }
    }

    try {
      // Reuse createTask — image models share the same task interface
      const result = await provider.createTask({
        model: params.model,
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        quality: params.quality,
        callbackUrl,
      });

      await db
        .update(images)
        .set({
          status: "GENERATING",
          externalTaskId: result.taskId,
          provider: providerType,
          updatedAt: new Date(),
        })
        .where(eq(images.uuid, imageResult.uuid));

      return {
        imageUuid: imageResult.uuid,
        taskId: result.taskId,
        provider: providerType,
        status: ImageStatus.GENERATING,
        creditsUsed: creditsRequired,
      };
    } catch (error) {
      await creditService.release(imageResult.uuid);
      await db
        .update(images)
        .set({
          status: "FAILED",
          errorMessage: String(error),
          updatedAt: new Date(),
        })
        .where(eq(images.uuid, imageResult.uuid));
      throw error;
    }
  }

  async handleCallback(
    providerType: ProviderType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    imageUuid: string
  ): Promise<void> {
    const provider = getProvider(providerType);
    const result = provider.parseCallback(payload);

    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.uuid, imageUuid))
      .limit(1);

    if (!image) {
      console.error(`Image not found: ${imageUuid}`);
      return;
    }

    if (image.externalTaskId && image.externalTaskId !== result.taskId) {
      console.error(
        `Image task ID mismatch: expected ${image.externalTaskId}, got ${result.taskId}`
      );
      return;
    }

    if (result.status === "completed" && result.videoUrl) {
      await this.tryCompleteGeneration(image.uuid, result);
    } else if (result.status === "failed") {
      await this.tryFailGeneration(image.uuid, result.error?.message);
    }
  }

  async refreshStatus(
    imageUuid: string,
    userId: string
  ): Promise<{ status: string; imageUrl?: string; error?: string }> {
    const [image] = await db
      .select()
      .from(images)
      .where(and(eq(images.uuid, imageUuid), eq(images.userId, userId)))
      .limit(1);

    if (!image) {
      throw new Error("Image not found");
    }

    if (
      image.status === ImageStatus.COMPLETED ||
      image.status === ImageStatus.FAILED
    ) {
      return {
        status: image.status,
        imageUrl: image.imageUrl || undefined,
        error: image.errorMessage || undefined,
      };
    }

    if (image.externalTaskId && image.provider) {
      try {
        const provider = getProvider(image.provider as ProviderType);
        const result = await provider.getTaskStatus(image.externalTaskId);

        if (result.status === "completed" && result.videoUrl) {
          const updated = await this.tryCompleteGeneration(image.uuid, result);
          return {
            status: updated.status,
            imageUrl: updated.imageUrl || undefined,
          };
        }

        if (result.status === "failed") {
          const updated = await this.tryFailGeneration(
            image.uuid,
            result.error?.message
          );
          return {
            status: updated.status,
            imageUrl: updated.imageUrl || undefined,
            error: updated.errorMessage || undefined,
          };
        }
      } catch (error) {
        console.error("Failed to refresh image status:", error);
      }
    }

    return { status: image.status };
  }

  private async tryCompleteGeneration(
    imageUuid: string,
    result: VideoTaskResponse
  ): Promise<{ status: string; imageUrl?: string | null }> {
    if (!result.videoUrl) {
      throw new Error("Missing image URL in completion result");
    }

    assertRemoteAssetDownloadConfigured();

    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.uuid, imageUuid))
      .limit(1);

    if (!image) {
      return { status: ImageStatus.FAILED, imageUrl: null };
    }

    if (image.status === ImageStatus.COMPLETED) {
      return { status: image.status, imageUrl: image.imageUrl };
    }

    if (image.status === ImageStatus.FAILED) {
      return { status: image.status, imageUrl: null };
    }

    if (
      image.status !== ImageStatus.GENERATING &&
      image.status !== ImageStatus.UPLOADING &&
      image.status !== ImageStatus.PENDING
    ) {
      return { status: image.status, imageUrl: image.imageUrl };
    }

    if (image.status !== ImageStatus.UPLOADING) {
      await db
        .update(images)
        .set({
          status: "UPLOADING",
          originalImageUrl: result.videoUrl,
          updatedAt: new Date(),
        })
        .where(eq(images.uuid, imageUuid));
    }

    let uploaded: { url: string; key: string; size: number };
    try {
      const storage = getStorage();
      const keyPrefix = `images/${imageUuid}/${Date.now()}`;
      uploaded = await storage.downloadAndUpload({
        sourceUrl: result.videoUrl,
        keyPrefix,
        kind: "image",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? `Image upload failed: ${error.message}`
          : "Image upload failed";
      await this.tryFailGeneration(imageUuid, message);
      return { status: ImageStatus.FAILED, imageUrl: null };
    }

    const finalized = await db.transaction(async (trx) => {
      const [latest] = await trx
        .select()
        .from(images)
        .where(eq(images.uuid, imageUuid))
        .limit(1);

      if (!latest) {
        return { status: ImageStatus.FAILED, imageUrl: null };
      }

      if (latest.status === ImageStatus.COMPLETED) {
        return { status: latest.status, imageUrl: latest.imageUrl };
      }

      if (latest.status === ImageStatus.FAILED) {
        return { status: latest.status, imageUrl: null };
      }

      const holdResult = await creditService.settleInTx(trx, imageUuid);
      if (holdResult.status === "RELEASED") {
        const [current] = await trx
          .select({
            status: images.status,
            imageUrl: images.imageUrl,
          })
          .from(images)
          .where(eq(images.uuid, imageUuid))
          .limit(1);

        return {
          status: current?.status || ImageStatus.FAILED,
          imageUrl: current?.imageUrl || null,
        };
      }

      await trx
        .update(images)
        .set({
          status: "COMPLETED",
          imageUrl: uploaded.url,
          fileSize: uploaded.size,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(images.uuid, imageUuid));

      return { status: ImageStatus.COMPLETED, imageUrl: uploaded.url };
    });

    return finalized;
  }

  private async tryFailGeneration(
    imageUuid: string,
    errorMessage?: string
  ): Promise<{
    status: string;
    errorMessage?: string | null;
    imageUrl?: string | null;
  }> {
    const failedMessage = errorMessage || "Generation failed";

    const finalized = await db.transaction(async (trx) => {
      const [image] = await trx
        .select()
        .from(images)
        .where(eq(images.uuid, imageUuid))
        .limit(1);

      if (!image) {
        return { status: ImageStatus.FAILED, errorMessage: failedMessage };
      }
      if (
        image.status === ImageStatus.COMPLETED ||
        image.status === ImageStatus.FAILED
      ) {
        return {
          status: image.status,
          errorMessage: image.errorMessage,
          imageUrl: image.imageUrl,
        };
      }

      const holdResult = await creditService.releaseInTx(trx, imageUuid);
      if (holdResult.status === "SETTLED") {
        const [current] = await trx
          .select({
            status: images.status,
            errorMessage: images.errorMessage,
            imageUrl: images.imageUrl,
          })
          .from(images)
          .where(eq(images.uuid, imageUuid))
          .limit(1);

        return {
          status: current?.status || ImageStatus.COMPLETED,
          errorMessage: current?.errorMessage,
          imageUrl: current?.imageUrl || null,
        };
      }

      await trx
        .update(images)
        .set({
          status: "FAILED",
          errorMessage: failedMessage,
          updatedAt: new Date(),
        })
        .where(eq(images.uuid, imageUuid));

      return {
        status: ImageStatus.FAILED,
        errorMessage: failedMessage,
        imageUrl: null,
      };
    });

    return finalized;
  }

  async getImage(uuid: string, userId: string) {
    const [image] = await db
      .select()
      .from(images)
      .where(
        and(
          eq(images.uuid, uuid),
          eq(images.userId, userId),
          eq(images.isDeleted, false)
        )
      )
      .limit(1);
    return image ?? null;
  }

  async listImages(
    userId: string,
    options?: { limit?: number; cursor?: string; status?: string }
  ) {
    const limit = options?.limit || 20;

    const conditions = [
      eq(images.userId, userId),
      eq(images.isDeleted, false),
    ];

    if (options?.status) {
      conditions.push(
        eq(
          images.status,
          options.status as (typeof ImageStatus)[keyof typeof ImageStatus]
        )
      );
    }

    if (options?.cursor) {
      let cursor = null;

      try {
        cursor = decodeCompositeCursor(options.cursor);
      } catch {
        const [legacyCursor] = await db
          .select({ createdAt: images.createdAt, uuid: images.uuid })
          .from(images)
          .where(eq(images.uuid, options.cursor))
          .limit(1);

        cursor = legacyCursor ?? null;
      }

      if (!cursor) {
        throw new ApiError("Invalid cursor", 400);
      }

      const cursorCondition = or(
        lt(images.createdAt, cursor.createdAt),
        and(eq(images.createdAt, cursor.createdAt), lt(images.uuid, cursor.uuid))
      );
      if (cursorCondition) {
        conditions.push(cursorCondition);
      }
    }

    const list = await db
      .select()
      .from(images)
      .where(and(...conditions))
      .orderBy(desc(images.createdAt), desc(images.uuid))
      .limit(limit + 1);

    const hasMore = list.length > limit;
    if (hasMore) list.pop();

    return {
      images: list,
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

  async deleteImage(uuid: string, userId: string): Promise<void> {
    await db
      .update(images)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(images.uuid, uuid), eq(images.userId, userId)));
  }
}

export const imageService = new ImageService();
