"use client";

import * as React from "react";
import { Play, Download, Trash2, Sparkles, Clock, Zap, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import { BlurFade } from "@/components/magicui/blur-fade";

interface Video {
  uuid: string;
  prompt: string;
  model: string;
  status: string;
  video_url?: string | null;
  videoUrl?: string | null;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;
  created_at?: string | Date;
  createdAt?: string | Date;
  credits_used?: number;
  creditsUsed?: number;
  duration?: string | number | null;
  resolution?: string | null;
  aspectRatio?: string | null;
  errorMessage?: string | null;
}

interface VideoCardProps {
  video: Video;
  onDelete?: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  showActions?: boolean;
  className?: string;
  labels?: Partial<{
    pending: string;
    generating: string;
    uploading: string;
    completed: string;
    failed: string;
    play: string;
    download: string;
    delete: string;
    retry: string;
    errorTitle: string;
  }>;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: Clock,
  },
  GENERATING: {
    label: "Generating",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Sparkles,
  },
  UPLOADING: {
    label: "Uploading",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Zap,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: Sparkles,
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: null,
  },
};

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "PENDING").toUpperCase() as keyof typeof statusConfig;
}

function formatDate(value: string | Date | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return `${value}s`;
  }
  return value ?? "";
}

function parseErrorMessage(errorMessage?: string | null) {
  if (!errorMessage) return "";
  try {
    const parsed = JSON.parse(errorMessage) as {
      error?: { message?: string };
      message?: string;
    };
    return parsed.error?.message ?? parsed.message ?? errorMessage;
  } catch {
    return errorMessage;
  }
}

function VideoThumbnail({
  video,
  labels,
}: {
  video: Video;
  labels?: VideoCardProps["labels"];
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [showOverlay, setShowOverlay] = React.useState(false);
  const videoUrl = video.video_url ?? video.videoUrl;
  const thumbnailUrl = video.thumbnail_url ?? video.thumbnailUrl;
  const normalizedStatus = normalizeStatus(video.status);

  const handleMouseEnter = () => {
    setShowOverlay(true);
    if (videoRef.current && normalizedStatus === "COMPLETED" && videoUrl) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setShowOverlay(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const config = statusConfig[normalizedStatus] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const labelMap = {
    PENDING: labels?.pending ?? "Pending",
    GENERATING: labels?.generating ?? "Generating",
    UPLOADING: labels?.uploading ?? "Uploading",
    COMPLETED: labels?.completed ?? "Completed",
    FAILED: labels?.failed ?? "Failed",
  };

  return (
    <div
      className="group/thumbnail relative aspect-video overflow-hidden rounded-t-[22px] bg-[#07110a]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video or Image Preview */}
      {normalizedStatus === "COMPLETED" && videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
        />
      ) : thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={video.prompt}
          className="w-full h-full object-cover opacity-80"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
          <div className="flex flex-col items-center gap-2">
            {StatusIcon && <StatusIcon className="w-8 h-8 text-zinc-600" />}
              <span className={cn("text-sm font-medium", config.color)}>
                {labelMap[normalizedStatus as keyof typeof labelMap] ?? config.label}
              </span>
            </div>
          </div>
      )}

      {/* Overlay Gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300",
          showOverlay || video.status !== "COMPLETED" ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Status Badge */}
      {normalizedStatus !== "COMPLETED" && (
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
              config.color
            )}
          >
            {StatusIcon && <StatusIcon className="w-3 h-3" />}
            {config.label}
          </span>
        </div>
      )}

      {/* Video Info Overlay */}
      {(video.duration || video.resolution) && normalizedStatus === "COMPLETED" && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {video.duration && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-xs text-white">
              <Clock className="w-3 h-3" />
              {formatDuration(video.duration)}
            </span>
          )}
          {video.resolution && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-xs text-white">
              {video.resolution}
            </span>
          )}
        </div>
      )}

      {/* Play Button Overlay */}
      {normalizedStatus === "COMPLETED" && videoUrl && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            showOverlay ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 group-hover/thumbnail:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}

function VideoActions({
  video,
  onDelete,
  onRetry,
  isRetrying,
  labels,
}: {
  video: Video;
  onDelete?: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  labels?: VideoCardProps["labels"];
}) {
  const videoUrl = video.video_url ?? video.videoUrl;
  const normalizedStatus = normalizeStatus(video.status);

  if (normalizedStatus === "FAILED") {
    if (!onDelete && !onRetry) return null;

    return (
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              "bg-emerald-500 text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
            )}
          >
            <RotateCcw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
            {labels?.retry ?? "Retry"}
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className={cn(
              "flex items-center justify-center px-4 py-2.5 rounded-xl transition-all",
              "bg-red-500/10 hover:bg-red-500/20 text-red-400"
            )}
            title={labels?.delete ?? "Delete"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (normalizedStatus !== "COMPLETED") return null;

  return (
    <div className="flex items-center gap-2">
      {videoUrl && (
        <>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              "bg-emerald-500 text-black hover:bg-emerald-400"
            )}
          >
            <Play className="w-4 h-4" />
            {labels?.play ?? "Play"}
          </a>
          <a
            href={videoUrl}
            download
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
              "bg-white/[0.05] text-white hover:bg-white/[0.09]"
            )}
            title={labels?.download ?? "Download"}
          >
            <Download className="w-4 h-4" />
          </a>
        </>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
            "bg-red-500/10 hover:bg-red-500/20 text-red-400"
          )}
          title={labels?.delete ?? "Delete"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function VideoCard({
  video,
  onDelete,
  onRetry,
  isRetrying = false,
  showActions = true,
  className,
  labels,
}: VideoCardProps) {
  const normalizedStatus = normalizeStatus(video.status);
  const createdAt = formatDate(video.createdAt ?? video.created_at);
  const creditsUsed = video.creditsUsed ?? video.credits_used ?? 0;
  const duration = formatDuration(video.duration);
  const errorMessage = parseErrorMessage(video.errorMessage);

  return (
    <BlurFade>
      <Card
        className={cn(
          "group overflow-hidden border-white/8 bg-[linear-gradient(180deg,rgba(7,18,10,0.9),rgba(4,11,7,0.94))] transition-colors duration-300 hover:bg-[#07150d]",
          className
        )}
      >
        <VideoThumbnail video={video} labels={labels} />

        <CardContent className="p-4 space-y-4">
          {/* Prompt */}
          <p
            className="text-sm text-zinc-300 line-clamp-2 leading-relaxed"
            title={video.prompt}
          >
            {video.prompt}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-zinc-500">{video.model}</span>
              {video.aspectRatio && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-500">{video.aspectRatio}</span>
                </>
              )}
              {duration && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-500">{duration}</span>
                </>
              )}
              {createdAt && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-500">{createdAt}</span>
                </>
              )}
            </div>
            <span className="flex items-center gap-1 text-zinc-300">
              <Sparkles className="w-3 h-3" />
              {creditsUsed}
            </span>
          </div>

          {normalizedStatus === "FAILED" && errorMessage && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">{labels?.errorTitle ?? "Generation failed"}</div>
                  <div className="mt-1 text-red-200/90">{errorMessage}</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <VideoActions
              video={video}
              onDelete={onDelete}
              onRetry={onRetry}
              isRetrying={isRetrying}
              labels={labels}
            />
          )}
        </CardContent>
      </Card>
    </BlurFade>
  );
}
