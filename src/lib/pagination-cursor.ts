import { ApiError } from "@/lib/api/error";

interface CursorPayload {
  createdAt: string;
  uuid: string;
}

export interface CompositeCursor {
  createdAt: Date;
  uuid: string;
}

export function encodeCompositeCursor(cursor: CompositeCursor): string {
  const payload: CursorPayload = {
    createdAt: cursor.createdAt.toISOString(),
    uuid: cursor.uuid,
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCompositeCursor(cursor: string): CompositeCursor {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as Partial<CursorPayload>;
    const createdAt = payload.createdAt ? new Date(payload.createdAt) : null;

    if (!createdAt || Number.isNaN(createdAt.getTime()) || !payload.uuid) {
      throw new Error("Malformed cursor payload");
    }

    return {
      createdAt,
      uuid: payload.uuid,
    };
  } catch {
    throw new ApiError("Invalid cursor", 400);
  }
}
