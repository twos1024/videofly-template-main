import crypto from "node:crypto";

import { ApiError } from "@/lib/api/error";

export function assertConfiguredBearerSecret(
  authorizationHeader: string | null,
  expectedSecret: string | undefined,
  featureName: string
): void {
  if (!expectedSecret) {
    throw new ApiError(`${featureName} is disabled`, 404);
  }

  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new ApiError("Unauthorized", 401);
  }

  const providedSecret = authorizationHeader.slice("Bearer ".length);
  if (providedSecret.length !== expectedSecret.length) {
    throw new ApiError("Unauthorized", 401);
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(providedSecret),
    Buffer.from(expectedSecret)
  );

  if (!isValid) {
    throw new ApiError("Unauthorized", 401);
  }
}
