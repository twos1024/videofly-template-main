import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";
import { assertRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { enableImageGeneration } from "@/config/features";
import { imageService } from "@/services/image";
// Import proxy configuration for fetch requests
import "@/lib/proxy-config";

const generateSchema = z.object({
  prompt: z.string().min(1).max(5000),
  model: z.string().min(1),
  aspectRatio: z.string().optional(),
  quality: z.string().optional(),
  style: z.string().optional(),
  templateId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!enableImageGeneration) {
      throw new ApiError("Image generation is disabled for this deployment", 404);
    }

    const user = await requireAuth(request);
    const clientIp = getClientIp(request);

    assertRateLimit({
      key: `image-generate:user:${user.id}`,
      limit: 10,
      windowMs: 60_000,
      message: "Too many image generation requests",
    });
    assertRateLimit({
      key: `image-generate:ip:${clientIp}`,
      limit: 30,
      windowMs: 60_000,
      message: "Too many image generation requests",
    });

    const body = await request.json();
    const data = generateSchema.parse(body);

    const result = await imageService.generate({
      userId: user.id,
      prompt: data.prompt,
      model: data.model,
      aspectRatio: data.aspectRatio,
      quality: data.quality,
      style: data.style,
      templateId: data.templateId,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
