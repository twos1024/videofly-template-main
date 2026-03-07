import { ApiError } from "./error";
import { ZodError } from "zod";

/**
 * Standard success response
 */
export function apiSuccess<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}

/**
 * Standard error response
 */
export function apiError(message: string, status = 400, details?: unknown) {
  return Response.json(
    {
      success: false,
      error: { message, details },
    },
    { status }
  );
}

/**
 * Handle errors and return appropriate response
 */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("Invalid request", 400, error.flatten());
  }
  if (error instanceof ApiError) {
    return apiError(error.message, error.status, error.details);
  }
  console.error("Unexpected error:", error);
  return apiError("Internal server error", 500);
}
