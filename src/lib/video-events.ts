import { EventEmitter } from "node:events";

import { sql } from "@/db";

export type VideoEventStatus = "COMPLETED" | "FAILED";

export interface VideoEvent {
  userId: string;
  videoUuid: string;
  status: VideoEventStatus;
  videoUrl?: string;
  thumbnailUrl?: string | null;
  error?: string;
}

const VIDEO_EVENT_CHANNEL = "video_events";

declare global {
  var __videoEventEmitter: EventEmitter | undefined;
  var __videoEventListenerReady: Promise<void> | undefined;
}

const emitter = globalThis.__videoEventEmitter || new EventEmitter();
emitter.setMaxListeners(0);
globalThis.__videoEventEmitter = emitter;

function hasDatabaseNotifications(): boolean {
  return Boolean(
    sql && typeof sql.listen === "function" && typeof sql.notify === "function"
  );
}

function isVideoEvent(value: unknown): value is VideoEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<VideoEvent>;
  return (
    typeof event.userId === "string" &&
    typeof event.videoUuid === "string" &&
    (event.status === "COMPLETED" || event.status === "FAILED")
  );
}

async function ensureVideoEventBridge(): Promise<void> {
  if (!hasDatabaseNotifications()) {
    return;
  }

  if (!globalThis.__videoEventListenerReady) {
    globalThis.__videoEventListenerReady = sql!
      .listen(VIDEO_EVENT_CHANNEL, (payload) => {
        try {
          const parsed = JSON.parse(payload);
          if (!isVideoEvent(parsed)) {
            console.error("Discarding malformed video event payload");
            return;
          }

          emitter.emit(VIDEO_EVENT_CHANNEL, parsed);
        } catch (error) {
          console.error("Failed to parse video event payload:", error);
        }
      })
      .then(() => undefined)
      .catch((error) => {
        globalThis.__videoEventListenerReady = undefined;
        throw error;
      });
  }

  await globalThis.__videoEventListenerReady;
}

export async function initializeVideoEvents(): Promise<void> {
  await ensureVideoEventBridge();
}

export async function emitVideoEvent(event: VideoEvent): Promise<void> {
  if (!hasDatabaseNotifications()) {
    emitter.emit(VIDEO_EVENT_CHANNEL, event);
    return;
  }

  await ensureVideoEventBridge();
  await sql!.notify(VIDEO_EVENT_CHANNEL, JSON.stringify(event));
}

export function onVideoEvent(listener: (event: VideoEvent) => void): () => void {
  emitter.on(VIDEO_EVENT_CHANNEL, listener);
  return () => emitter.off(VIDEO_EVENT_CHANNEL, listener);
}
