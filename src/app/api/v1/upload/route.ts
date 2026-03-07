import { nanoid } from "nanoid";

import { requireAuth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/error";
import { assertRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { handleApiError, apiSuccess } from "@/lib/api/response";
import {
  MAX_UPLOAD_IMAGE_BYTES,
  validateUploadedImage,
} from "@/lib/media-validation";
import { getStorage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const clientIp = getClientIp(request);

    assertRateLimit({
      key: `upload:user:${user.id}`,
      limit: 20,
      windowMs: 60_000,
      message: "Too many upload requests",
    });
    assertRateLimit({
      key: `upload:ip:${clientIp}`,
      limit: 60,
      windowMs: 60_000,
      message: "Too many upload requests",
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("Missing file", 400);
    }

    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      throw new ApiError("File too large", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const media = validateUploadedImage(buffer);
    const key = `uploads/${user.id}/${nanoid()}.${media.extension}`;

    const storage = getStorage();
    const uploaded = await storage.uploadFile({
      key,
      body: buffer,
      contentType: media.contentType,
    });

    return apiSuccess({ publicUrl: uploaded.url, key });
  } catch (error) {
    return handleApiError(error);
  }
}
