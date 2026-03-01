import { db } from "@/db";
import { images } from "@/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";
import { getProvider, type ProviderType } from "@/ai";
import type { VideoTaskResponse } from "@/ai/types";
import { creditService } from "./credit";
import { generateSignedCallbackUrl } from "@/ai/utils/callback-signature";
import {
  calculateImageCredits,
  getImageModelConfig,
} from "@/config/credits";

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
    this.callbackBaseUrl = process.env.AI_CALLBACK_URL
      ? process.env.AI_CALLBACK_URL.replace("/video/callback", "/image/callback")
      : "";
  }

  async generate(params: GenerateImageParams): Promise<ImageGenerationResult> {
    const modelConfig = getImageModelConfig(params.model);
    if (!modelConfig) {
      throw new Error(`Unsupported image model: ${params.model}`);
    }

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

    const callbackUrl = this.callbackBaseUrl
      ? generateSignedCallbackUrl(
          `${this.callbackBaseUrl}/${providerType}`,
          imageResult.uuid
        )
      : undefined;

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

    let uploaded: { url: string; key: string };
    try {
      const storage = getStorage();
      const key = `images/${imageUuid}/${Date.now()}.png`;
      uploaded = await storage.downloadAndUpload({
        sourceUrl: result.videoUrl,
        key,
        contentType: "image/png",
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

      await creditService.settleInTx(trx, imageUuid);

      await trx
        .update(images)
        .set({
          status: "COMPLETED",
          imageUrl: uploaded.url,
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
  ): Promise<{ status: string; errorMessage?: string | null }> {
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
        return { status: image.status, errorMessage: image.errorMessage };
      }

      try {
        await creditService.releaseInTx(trx, imageUuid);
      } catch (error) {
        console.error(`Failed to release image credits for ${imageUuid}:`, error);
      }

      await trx
        .update(images)
        .set({
          status: "FAILED",
          errorMessage: failedMessage,
          updatedAt: new Date(),
        })
        .where(eq(images.uuid, imageUuid));

      return { status: ImageStatus.FAILED, errorMessage: failedMessage };
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
      const [cursorImage] = await db
        .select({ createdAt: images.createdAt })
        .from(images)
        .where(eq(images.uuid, options.cursor))
        .limit(1);

      if (cursorImage) {
        conditions.push(lt(images.createdAt, cursorImage.createdAt));
      }
    }

    const list = await db
      .select()
      .from(images)
      .where(and(...conditions))
      .orderBy(desc(images.createdAt))
      .limit(limit + 1);

    const hasMore = list.length > limit;
    if (hasMore) list.pop();

    return {
      images: list,
      nextCursor: hasMore ? list[list.length - 1]?.uuid : undefined,
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
