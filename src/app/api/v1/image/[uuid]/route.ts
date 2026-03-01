import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { imageService } from "@/services/image";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { uuid } = await params;

    const image = await imageService.getImage(uuid, user.id);

    if (!image) {
      return apiError("Image not found", 404);
    }

    return apiSuccess(image);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { uuid } = await params;

    await imageService.deleteImage(uuid, user.id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
