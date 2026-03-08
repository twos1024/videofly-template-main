"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { VideoCard, VideoStatusCard } from "@/components/video-generator";
import { cn } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { videoTaskStorage } from "@/lib/video-task-storage";
import { DemoVideos } from "./demo-videos";
import type { VideoHistoryItem } from "@/lib/video-history-storage";

interface VideoHistoryPanelProps {
  userId?: string;
  historyItems: VideoHistoryItem[];
  generatingIds?: string[];
  onDelete?: (uuid: string) => void | Promise<void>;
  onRetry?: (uuid: string) => void | Promise<void>;
  className?: string;
}

interface VisibleHistoryItem extends VideoHistoryItem {}

function formatHistoryTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildMeta(video: VisibleHistoryItem) {
  return [
    video.model,
    video.aspectRatio,
    typeof video.duration === "number" ? `${video.duration}s` : undefined,
    formatHistoryTime(video.createdAt),
  ].filter((value): value is string => Boolean(value));
}

export function VideoHistoryPanel({
  userId,
  historyItems,
  generatingIds = [],
  onDelete,
  onRetry,
  className,
}: VideoHistoryPanelProps) {
  const tHistory = useTranslations("VideoHistory");
  const tTool = useTranslations("ToolPage");
  const tStatus = useTranslations("dashboard.myCreations.status");
  const tActions = useTranslations("dashboard.myCreations.actions");
  const tDeleteConfirm = useTranslations("dashboard.myCreations.deleteConfirm");
  const locale = useLocale();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  const recentItems = useMemo(
    () =>
      [...historyItems]
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(-10),
    [historyItems]
  );

  const fallbackGeneratingItems = useMemo(() => {
    if (!userId) return [];

    const knownIds = new Set(recentItems.map((item) => item.uuid));
    return videoTaskStorage
      .getGeneratingTasks(userId)
      .filter(
        (task) => generatingIds.includes(task.videoId) && !knownIds.has(task.videoId)
      )
      .map<VisibleHistoryItem>((task) => ({
        uuid: task.videoId,
        userId,
        prompt: task.prompt ?? "",
        model: task.model ?? "",
        status: "generating",
        creditsUsed: 0,
        createdAt: new Date(task.createdAt).toISOString(),
        updatedAt: new Date(task.createdAt).toISOString(),
      }));
  }, [generatingIds, recentItems, userId]);

  const visibleItems = useMemo(
    () =>
      [...recentItems, ...fallbackGeneratingItems]
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(-10),
    [fallbackGeneratingItems, recentItems]
  );

  useEffect(() => {
    if (!scrollRef.current || visibleItems.length === 0) return;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [visibleItems.length]);

  const hasItems = visibleItems.length > 0;

  const handleDelete = async (uuid: string) => {
    if (!onDelete) return;
    setIsDeleting(uuid);
    try {
      await onDelete(uuid);
    } finally {
      setIsDeleting(null);
      setDeleteDialogOpen(null);
    }
  };

  const handleRetry = async (uuid: string) => {
    if (!onRetry) return;
    setIsRetrying(uuid);
    try {
      await onRetry(uuid);
    } finally {
      setIsRetrying(null);
    }
  };

  return (
    <div
      className={cn(
        "h-full w-full rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(7,18,10,0.88),rgba(4,11,7,0.94))] overflow-hidden flex flex-col shadow-[0_22px_60px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          {hasItems ? tHistory("title") : tHistory("demoTitle")}
        </div>
        {hasItems && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/my-creations`)}
            className="h-7 text-xs text-white/56 hover:text-white hover:bg-white/[0.04]"
          >
            {tHistory("moreCreations")}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        {!hasItems ? (
          <div className="flex h-full flex-col justify-center">
            <DemoVideos />
          </div>
        ) : (
          <div className="space-y-4">
            {visibleItems.map((video) => {
              const isGenerating =
                generatingIds.includes(video.uuid) || video.status === "generating";
              const labels = {
                pending: tStatus("pending"),
                generating: tStatus("generating"),
                uploading: tStatus("uploading"),
                completed: tStatus("completed"),
                failed: tStatus("failed"),
                play: tActions("play"),
                download: tActions("download"),
                delete: tActions("delete"),
                retry: tActions("retry"),
                errorTitle: tHistory("generationFailed"),
              };

              if (isGenerating) {
                return (
                  <VideoStatusCard
                    key={video.uuid}
                    status="GENERATING"
                    prompt={video.prompt || tHistory("untitled")}
                    meta={buildMeta(video)}
                    identifier={`#${video.uuid.slice(0, 8)}`}
                    labels={{
                      title: tTool("queueTitle"),
                      pending: tStatus("pending"),
                      generating: tStatus("generating"),
                      uploading: tStatus("uploading"),
                      completed: tStatus("completed"),
                      failed: tStatus("failed"),
                      waiting: tStatus("processing"),
                      generatingHint: tTool("generatingHint"),
                      uploadingHint: tStatus("uploading"),
                    }}
                  />
                );
              }

              return (
                <VideoCard
                  key={video.uuid}
                  className="w-full"
                  video={{
                    uuid: video.uuid,
                    prompt: video.prompt || tHistory("untitled"),
                    model: video.model || "N/A",
                    status: video.status.toUpperCase(),
                    videoUrl: video.videoUrl ?? null,
                    thumbnailUrl: video.thumbnailUrl ?? null,
                    createdAt: video.createdAt,
                    creditsUsed: video.creditsUsed,
                    duration: video.duration ?? null,
                    aspectRatio: video.aspectRatio ?? null,
                    errorMessage:
                      video.status === "failed" ? tHistory("generationFailed") : null,
                  }}
                  onDelete={
                    onDelete ? () => setDeleteDialogOpen(video.uuid) : undefined
                  }
                  onRetry={
                    video.status === "failed" && onRetry
                      ? () => handleRetry(video.uuid)
                      : undefined
                  }
                  isRetrying={isRetrying === video.uuid}
                  labels={labels}
                />
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteDialogOpen !== null}
        onOpenChange={(open) => !open && setDeleteDialogOpen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDeleteConfirm("title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tDeleteConfirm("message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tDeleteConfirm("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialogOpen ? handleDelete(deleteDialogOpen) : undefined
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting !== null}
            >
              {tDeleteConfirm("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
