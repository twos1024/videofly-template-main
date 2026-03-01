import { NextRequest } from "next/server";
import { type ProviderType } from "@/ai";
import { verifyCallbackSignature } from "@/ai/utils/callback-signature";
import { apiSuccess, apiError } from "@/lib/api/response";
import { imageService } from "@/services/image";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const providerType = provider as ProviderType;

    // Validate provider type
    if (!["evolink", "kie"].includes(providerType)) {
      return apiError("Invalid provider", 400);
    }

    // Get signature parameters from URL
    const { searchParams } = new URL(request.url);
    const imageUuid = searchParams.get("videoUuid"); // reuses the videoUuid param name in the signed URL
    const timestamp = searchParams.get("ts");
    const signature = searchParams.get("sig");

    if (!imageUuid || !timestamp || !signature) {
      console.error("Missing callback signature parameters");
      return apiError("Missing signature parameters", 400);
    }

    const verification = verifyCallbackSignature(imageUuid, timestamp, signature);
    if (!verification.valid) {
      console.error(
        `Image callback signature verification failed: ${verification.error}`
      );
      return apiError(verification.error || "Invalid signature", 401);
    }

    const payload = await request.json();

    // Pass in imageUuid (already verified)
    await imageService.handleCallback(providerType, payload, imageUuid);

    return apiSuccess({ received: true });
  } catch (error) {
    console.error("Image callback error:", error);
    return apiError("Callback processing failed", 500);
  }
}
