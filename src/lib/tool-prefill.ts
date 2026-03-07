"use client";

export interface ToolPrefillData {
  prompt?: string;
  model?: string;
  duration?: number;
  aspectRatio?: string;
  quality?: string;
  imageUrl?: string;
}

export const TOOL_PREFILL_KEY = "videofly_tool_prefill";

let pendingImageFile: File | null = null;

export function saveToolPrefill(
  payload: ToolPrefillData & { imageFile?: File | null }
): void {
  if (typeof window === "undefined") {
    return;
  }

  const { imageFile, ...serializablePayload } = payload;
  pendingImageFile = imageFile ?? null;
  sessionStorage.setItem(TOOL_PREFILL_KEY, JSON.stringify(serializablePayload));
}

export function consumeToolPrefill():
  | (ToolPrefillData & { imageFile?: File })
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(TOOL_PREFILL_KEY);
  const imageFile = pendingImageFile ?? undefined;
  pendingImageFile = null;

  if (!raw) {
    return imageFile ? { imageFile } : null;
  }

  sessionStorage.removeItem(TOOL_PREFILL_KEY);

  try {
    const parsed = JSON.parse(raw) as ToolPrefillData;
    return {
      ...parsed,
      imageFile,
    };
  } catch (error) {
    console.warn("Failed to read tool prefill data:", error);
    return imageFile ? { imageFile } : null;
  }
}
