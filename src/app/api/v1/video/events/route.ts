import { NextRequest } from "next/server";
import { enableRealtimeVideoEvents } from "@/config/features";
import { requireAuth } from "@/lib/api/auth";
import { initializeVideoEvents, onVideoEvent } from "@/lib/video-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!enableRealtimeVideoEvents) {
    return new Response(null, { status: 404 });
  }

  const user = await requireAuth(request);
  await initializeVideoEvents();
  const encoder = new TextEncoder();

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (eventName: string, payload: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const unsubscribe = onVideoEvent((event) => {
        if (event.userId !== user.id) return;
        send("video", event);
      });

      const heartbeat = setInterval(() => {
        send("ping", {});
      }, 20000);

      send("ready", { ok: true });

      const abortHandler = () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener("abort", abortHandler);

      cleanup = () => {
        request.signal.removeEventListener("abort", abortHandler);
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
