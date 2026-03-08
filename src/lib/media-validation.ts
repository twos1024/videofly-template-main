import { ApiError } from "@/lib/api/error";

export type MediaKind = "image" | "video";

export interface ValidatedMedia {
  kind: MediaKind;
  contentType: string;
  extension: string;
  size: number;
}

const ONE_MEGABYTE = 1024 * 1024;
const REMOTE_ASSET_ALLOWLIST_REQUIRED_MESSAGE =
  "REMOTE_ASSET_ALLOWED_HOSTS must be configured in production";

export const MAX_UPLOAD_IMAGE_BYTES = 10 * ONE_MEGABYTE;
export const MAX_REMOTE_IMAGE_BYTES = 15 * ONE_MEGABYTE;
export const MAX_REMOTE_VIDEO_BYTES = 100 * ONE_MEGABYTE;

const MAX_REMOTE_REDIRECTS = 3;
const LOCAL_DEV_HOSTS = new Set(["127.0.0.1", "localhost"]);

const MEDIA_SIGNATURES: Array<
  Omit<ValidatedMedia, "size"> & { matches: (buffer: Buffer) => boolean }
> = [
  {
    kind: "image",
    contentType: "image/jpeg",
    extension: "jpg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    kind: "image",
    contentType: "image/png",
    extension: "png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a,
  },
  {
    kind: "image",
    contentType: "image/gif",
    extension: "gif",
    matches: (buffer) =>
      buffer.length >= 6 &&
      buffer.subarray(0, 6).toString("ascii") === "GIF87a",
  },
  {
    kind: "image",
    contentType: "image/gif",
    extension: "gif",
    matches: (buffer) =>
      buffer.length >= 6 &&
      buffer.subarray(0, 6).toString("ascii") === "GIF89a",
  },
  {
    kind: "image",
    contentType: "image/webp",
    extension: "webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    kind: "video",
    contentType: "video/mp4",
    extension: "mp4",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(4, 8).toString("ascii") === "ftyp",
  },
  {
    kind: "video",
    contentType: "video/webm",
    extension: "webm",
    matches: (buffer) =>
      buffer.length >= 4 &&
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3,
  },
];

function getMaxRemoteBytes(kind: MediaKind): number {
  return kind === "image" ? MAX_REMOTE_IMAGE_BYTES : MAX_REMOTE_VIDEO_BYTES;
}

function detectMedia(buffer: Buffer): Omit<ValidatedMedia, "size"> | null {
  const matched = MEDIA_SIGNATURES.find((signature) => signature.matches(buffer));
  return matched
    ? {
        kind: matched.kind,
        contentType: matched.contentType,
        extension: matched.extension,
      }
    : null;
}

function validateMediaBuffer(
  buffer: Buffer,
  kind: MediaKind,
  maxBytes: number,
  sourceLabel: string
): ValidatedMedia {
  if (buffer.length === 0) {
    throw new ApiError(`${sourceLabel} is empty`, 400);
  }

  if (buffer.length > maxBytes) {
    throw new ApiError(`${sourceLabel} exceeds the size limit`, 400);
  }

  const detected = detectMedia(buffer);
  if (!detected || detected.kind !== kind) {
    throw new ApiError(`Unsupported ${kind} format`, 400);
  }

  return {
    ...detected,
    size: buffer.length,
  };
}

function getAllowedRemoteHostPatterns(): string[] {
  return (process.env.REMOTE_ASSET_ALLOWED_HOSTS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function assertRemoteAssetDownloadConfigured(): void {
  if (
    process.env.NODE_ENV === "production" &&
    getAllowedRemoteHostPatterns().length === 0
  ) {
    throw new Error(REMOTE_ASSET_ALLOWLIST_REQUIRED_MESSAGE);
  }
}

function matchesAllowedHost(hostname: string, pattern: string): boolean {
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(2);
    return hostname === suffix || hostname.endsWith(`.${suffix}`);
  }

  return hostname === pattern;
}

function assertAllowedRemoteAssetUrl(rawUrl: string): URL {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid remote asset URL");
  }

  const hostname = url.hostname.toLowerCase();
  const allowHttpForLocalDev =
    process.env.NODE_ENV !== "production" && LOCAL_DEV_HOSTS.has(hostname);

  if (!allowHttpForLocalDev && url.protocol !== "https:") {
    throw new Error("Remote asset URL must use HTTPS");
  }

  const allowlist = getAllowedRemoteHostPatterns();
  if (allowlist.length === 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(REMOTE_ASSET_ALLOWLIST_REQUIRED_MESSAGE);
    }
    return url;
  }

  if (!allowlist.some((pattern) => matchesAllowedHost(hostname, pattern))) {
    throw new Error(`Remote asset host is not allowlisted: ${hostname}`);
  }

  return url;
}

async function fetchRemoteResponse(sourceUrl: string): Promise<Response> {
  let currentUrl = assertAllowedRemoteAssetUrl(sourceUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REMOTE_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, { redirect: "manual" });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const nextLocation = response.headers.get("location");
      if (!nextLocation) {
        throw new Error("Remote asset redirect is missing a location");
      }

      currentUrl = assertAllowedRemoteAssetUrl(
        new URL(nextLocation, currentUrl).toString()
      );
      continue;
    }

    if (!response.ok) {
      throw new Error(`Failed to download remote asset: ${response.status}`);
    }

    return response;
  }

  throw new Error("Too many remote asset redirects");
}

async function readResponseBuffer(
  response: Response,
  maxBytes: number
): Promise<Buffer> {
  const contentLengthHeader = response.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (!Number.isNaN(contentLength) && contentLength > maxBytes) {
      throw new ApiError("Remote asset exceeds the size limit", 400);
    }
  }

  if (!response.body) {
    return Buffer.from(await response.arrayBuffer());
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel("Remote asset exceeded the size limit");
      throw new ApiError("Remote asset exceeds the size limit", 400);
    }

    chunks.push(value);
  }

  const combined = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return Buffer.from(
    combined.buffer,
    combined.byteOffset,
    combined.byteLength
  );
}

export function validateUploadedImage(buffer: Buffer): ValidatedMedia {
  return validateMediaBuffer(buffer, "image", MAX_UPLOAD_IMAGE_BYTES, "Uploaded image");
}

export async function fetchValidatedRemoteMedia(params: {
  sourceUrl: string;
  kind: MediaKind;
}): Promise<ValidatedMedia & { buffer: Buffer }> {
  const maxBytes = getMaxRemoteBytes(params.kind);
  const response = await fetchRemoteResponse(params.sourceUrl);
  const buffer = await readResponseBuffer(response, maxBytes);
  const media = validateMediaBuffer(
    buffer,
    params.kind,
    maxBytes,
    "Remote asset"
  );

  return {
    ...media,
    buffer,
  };
}
