"use client";

import { Clock3, Sparkles, UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/components/ui";

interface VideoStatusCardProps {
  status: string;
  videoUrl?: string;
  error?: string;
  prompt?: string;
  meta?: string[];
  identifier?: string;
  className?: string;
  labels?: Partial<{
    title: string;
    pending: string;
    generating: string;
    uploading: string;
    completed: string;
    failed: string;
    waiting: string;
    generatingHint: string;
    uploadingHint: string;
    download: string;
    copyUrl: string;
  }>;
}

export function VideoStatusCard({
  status,
  videoUrl,
  error,
  prompt,
  meta,
  identifier,
  className,
  labels,
}: VideoStatusCardProps) {
  const normalizedStatus = (status ?? "PENDING").toUpperCase();
  const statusConfig = {
    PENDING: {
      label: labels?.pending ?? "Pending",
      color: "text-amber-300",
      bg: "bg-amber-500/10 border-amber-400/20",
      icon: Clock3,
    },
    GENERATING: {
      label: labels?.generating ?? "Generating",
      color: "text-sky-300",
      bg: "bg-sky-500/10 border-sky-400/20",
      icon: Sparkles,
    },
    UPLOADING: {
      label: labels?.uploading ?? "Uploading",
      color: "text-violet-300",
      bg: "bg-violet-500/10 border-violet-400/20",
      icon: UploadCloud,
    },
    COMPLETED: {
      label: labels?.completed ?? "Completed",
      color: "text-emerald-300",
      bg: "bg-emerald-500/10 border-emerald-400/20",
      icon: CheckCircle2,
    },
    FAILED: {
      label: labels?.failed ?? "Failed",
      color: "text-red-300",
      bg: "bg-red-500/10 border-red-400/20",
      icon: AlertCircle,
    },
  };

  const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "w-full rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,18,10,0.94),rgba(4,11,7,0.96))] p-6 text-white shadow-[0_26px_80px_rgba(0,0,0,0.34)]",
        className
      )}
    >
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/40">
              {labels?.title ?? "Video Status"}
            </div>
            {prompt ? (
              <p className="max-w-2xl text-sm leading-6 text-white/86">{prompt}</p>
            ) : (
              <h3 className="font-medium text-white">{config.label}</h3>
            )}
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border",
              config.bg,
              config.color
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </span>
        </div>

        {meta && meta.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/60"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Progress Indicator */}
        {(normalizedStatus === "PENDING" || normalizedStatus === "GENERATING" || normalizedStatus === "UPLOADING") && (
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className={cn(
                  "h-full rounded-full animate-pulse",
                  normalizedStatus === "PENDING" && "w-1/4 bg-yellow-500",
                  normalizedStatus === "GENERATING" && "w-1/2 bg-blue-500",
                  normalizedStatus === "UPLOADING" && "w-3/4 bg-purple-500"
                )}
              />
            </div>
            <p className="text-sm text-white/54">
              {normalizedStatus === "PENDING" && (labels?.waiting ?? "Waiting in queue...")}
              {normalizedStatus === "GENERATING" && (labels?.generatingHint ?? "AI is generating your video...")}
              {normalizedStatus === "UPLOADING" && (labels?.uploadingHint ?? "Uploading to storage...")}
            </p>
          </div>
        )}

        {identifier && (
          <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2 text-xs font-mono text-white/38">
            {identifier}
          </div>
        )}

        {/* Error Message */}
        {normalizedStatus === "FAILED" && error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Video Player */}
        {normalizedStatus === "COMPLETED" && videoUrl && (
          <div className="space-y-3">
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg bg-black"
              autoPlay
              loop
            />
            <div className="flex gap-2">
              <a
                href={videoUrl}
                download
                className="flex-1 py-2 text-center text-sm font-medium rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
              >
                {labels?.download ?? "Download Video"}
              </a>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(videoUrl)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              >
                {labels?.copyUrl ?? "Copy URL"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
