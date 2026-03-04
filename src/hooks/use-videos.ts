"use client";

// ============================================
// Video Hooks
// ============================================

import { useCallback, useEffect, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/api/dashboard-client";
import type { VideoFilterOptions } from "@/lib/types/dashboard";

/**
 * Fetch videos with infinite scroll
 */
export function useVideos(filter?: VideoFilterOptions) {
  const queryClient = useQueryClient();
  const t = useTranslations("dashboard.myCreations");

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["videos", filter],
    queryFn: async ({ pageParam }) => {
      return apiClient.getVideos({
        limit: 20,
        cursor: pageParam,
        status: filter?.status && filter.status !== "all" ? filter.status : undefined,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    refetchOnWindowFocus: false,
  });

  // Flatten pages
  const videos = useMemo(() => {
    const items = data?.pages.flatMap((page) => page.videos) || [];
    const filteredByModel = filter?.model && filter.model !== "all"
      ? items.filter((item) => item.model === filter.model)
      : items;

    const sorted = [...filteredByModel];
    sorted.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return filter?.sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });
    return sorted;
  }, [data, filter?.model, filter?.sortBy]);
  const hasMore = hasNextPage || false;

  // 删除视频
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      return apiClient.deleteVideo(uuid);
    },
    onMutate: (uuid) => {
      // 乐观删除
      const previousVideos = queryClient.getQueryData(["videos", filter]);
      queryClient.setQueryData(
        ["videos", filter],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              videos: page.videos.filter((v: any) => v.uuid !== uuid),
            })),
          };
        }
      );

      return { previousVideos };
    },
    onSuccess: () => {
      toast.success(t("actions.deleteSuccess") || "Video deleted successfully");
    },
    onError: (error, variables, context) => {
      // 回滚
      if (context) {
        queryClient.setQueryData(["videos", filter], context.previousVideos);
      }
      toast.error(t("actions.deleteError") || "Failed to delete video");
    },
  });

  // 重试失败视频
  const retryMutation = useMutation({
    mutationFn: async (uuid: string) => {
      return apiClient.retryVideo(uuid);
    },
    onSuccess: () => {
      toast.success(t("actions.retrySuccess") || "Retry initiated");
      refetch();
    },
    onError: () => {
      toast.error(t("actions.retryError") || "Failed to retry");
    },
  });

  // 删除单个视频
  const deleteVideo = useCallback(
    async (uuid: string) => {
      await deleteMutation.mutateAsync(uuid);
    },
    [deleteMutation]
  );

  // 重试单个视频
  const retryVideo = useCallback(
    async (uuid: string) => {
      await retryMutation.mutateAsync(uuid);
    },
    [retryMutation]
  );

  return {
    videos,
    isLoading,
    error,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    deleteVideo,
    retryVideo,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Get single video
 */
export function useVideo(uuid: string) {
  return useQuery({
    queryKey: ["video", uuid],
    queryFn: () => apiClient.getVideo(uuid),
    enabled: !!uuid,
    select: (data) => data.video,
  });
}

/**
 * Download video
 */
export function useDownloadVideo() {
  const t = useTranslations("dashboard.myCreations");

  const download = useCallback((videoUrl: string, filename: string) => {
    try {
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(t("actions.downloadSuccess") || "Download started");
    } catch {
      toast.error(t("actions.downloadError") || "Failed to download video");
    }
  }, [t]);

  return { download };
}

/**
 * Auto-refresh processing videos
 */
export function useRefreshProcessingVideos(
  videos: Array<{ status?: string }>,
  refetch: () => void,
  interval = 15000
) {
  const hasProcessing = videos.some((v) => {
    const status = (v.status || "").toLowerCase();
    return status === "generating" || status === "uploading" || status === "pending";
  });

  useEffect(() => {
    if (!hasProcessing) return;

    const poll = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      refetch();
    };

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        poll();
      }
    };

    const timer = setInterval(() => {
      poll();
    }, interval);

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      clearInterval(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [hasProcessing, interval, refetch]);
}
