import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { imageService } from "@/services/image";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const result = await imageService.listImages(user.id, {
      limit: Math.min(Math.max(1, Number.parseInt(searchParams.get("limit") || "20")), 100),
      cursor: searchParams.get("cursor") || undefined,
      status: searchParams.get("status") || undefined,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
