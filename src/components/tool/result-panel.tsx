"use client";

import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { VideoCard, VideoStatusCard } from "@/components/video-generator";
import { cn } from "@/components/ui";
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
import type { Video } from "@/db";

interface ResultPanelProps {
  currentVideos?: Video[];
  generatingIds?: string[];
  onRegenerate?: () => void;
  onDelete?: (uuid: string) => void | Promise<void>;
  onRetry?: (uuid: string) => void | Promise<void>;
  className?: string;
}

export function ResultPanel({
  currentVideos = [],
  generatingIds = [],
  onRegenerate,
  onDelete,
  onRetry,
  className,
}: ResultPanelProps) {
  const tTool = useTranslations("ToolPage");
  const tStatus = useTranslations("dashboard.myCreations.status");
  const tActions = useTranslations("dashboard.myCreations.actions");
  const tDeleteConfirm = useTranslations("dashboard.myCreations.deleteConfirm");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const normalizeStatus = (status: string | null | undefined) =>
    (status ?? "PENDING").toUpperCase();

  const hasItems = currentVideos.length > 0 || generatingIds.length > 0;

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

  if (!hasItems) {
    return (
      <div
        className={cn(
          "h-full w-full rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(7,18,10,0.88),rgba(4,11,7,0.94))] shadow-[0_22px_60px_rgba(0,0,0,0.28)]",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            {tTool("exploreTitle")}
          </div>
          <span className="text-xs text-white/44">{tTool("exploreSubtitle")}</span>
        </div>

        <div className="grid h-full gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="flex flex-col justify-center rounded-2xl border border-white/8 bg-white/[0.03] p-6">
            <div className="text-base font-semibold text-white">{tTool("emptyTitle")}</div>
            <div className="mt-2 text-sm text-white/56">{tTool("emptySubtitle")}</div>
            <div className="mt-6 text-xs uppercase tracking-wide text-white/38">
              {tTool("promptIdeas")}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {[tTool("promptExample1"), tTool("promptExample2"), tTool("promptExample3")].map((text) => (
                <div
                  key={text}
                  className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white/82"
                >
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wide text-white/38">
              {tTool("tipsTitle")}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white/82">
              <li>{tTool("tipsLine1")}</li>
              <li>{tTool("tipsLine2")}</li>
              <li>{tTool("tipsLine3")}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

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
    errorTitle: tTool("errors.generateFailed"),
  };

  return (
    <div
      className={cn(
        "h-full w-full rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(7,18,10,0.88),rgba(4,11,7,0.94))] shadow-[0_22px_60px_rgba(0,0,0,0.28)] overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          {tTool("resultTitle")}
        </div>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/84 transition-all hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-3 w-3" />
            {tTool("newGeneration")}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 xl:grid-cols-2">
          {generatingIds.map((videoId) => (
            <VideoStatusCard
              key={`generating-${videoId}`}
              status="GENERATING"
              identifier={`#${videoId.slice(0, 8)}`}
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
          ))}

          {currentVideos.map((video) => (
            <VideoCard
              key={video.uuid}
              video={{
                uuid: video.uuid,
                prompt: video.prompt,
                model: video.model,
                status: video.status,
                videoUrl: video.videoUrl ?? null,
                thumbnailUrl: video.thumbnailUrl ?? null,
                createdAt: video.createdAt,
                creditsUsed: video.creditsUsed,
                duration: video.duration ?? null,
                aspectRatio: video.aspectRatio ?? null,
                errorMessage: video.errorMessage ?? null,
              }}
              onDelete={onDelete ? () => setDeleteDialogOpen(video.uuid) : undefined}
              onRetry={
                normalizeStatus(video.status) === "FAILED" && onRetry
                  ? () => handleRetry(video.uuid)
                  : undefined
              }
              isRetrying={isRetrying === video.uuid}
              labels={labels}
            />
          ))}
        </div>
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
