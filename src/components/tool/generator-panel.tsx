"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CompactGenerator, type SubmitData, type UploadedImage } from "@/components/video-generator";
import { cn } from "@/components/ui";
import type { ToolPageConfig } from "@/config/tool-pages";
import { adaptToolPageConfigToGeneratorConfig } from "@/config/tool-pages/adapter";

interface GeneratorPanelProps {
  toolType: "image-to-video" | "text-to-video" | "reference-to-video";
  toolConfig: ToolPageConfig;
  isLoading?: boolean;
  onSubmit?: (data: GeneratorData) => void;
  availableModelIds?: string[];
  defaultModelId?: string;
  initialPrompt?: string;
  initialModelId?: string;
  initialDuration?: number;
  initialAspectRatio?: string;
  initialQuality?: string;
  initialImageUrl?: string;
  initialImageFile?: File;
  allowUnifiedInput?: boolean;
}

export interface GeneratorData {
  toolType: string;
  model: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  quality?: string;
  imageFile?: File;
  imageUrl?: string;
  estimatedCredits: number;
}

export function GeneratorPanel({
  toolType,
  toolConfig,
  isLoading = false,
  onSubmit,
  availableModelIds,
  defaultModelId,
  initialPrompt,
  initialModelId,
  initialDuration,
  initialAspectRatio,
  initialQuality,
  initialImageUrl,
  initialImageFile,
  allowUnifiedInput = false,
}: GeneratorPanelProps) {
  const tTool = useTranslations("ToolPage");
  const tGenerator = useTranslations("ToolPage.generator");
  const [initialUploadedImages, setInitialUploadedImages] = useState<UploadedImage[]>([]);

  useEffect(() => {
    let objectUrl: string | undefined;

    if (initialImageFile) {
      objectUrl = URL.createObjectURL(initialImageFile);
      setInitialUploadedImages([
        {
          file: initialImageFile,
          preview: objectUrl,
          slot: "default",
        },
      ]);
    } else if (initialImageUrl) {
      setInitialUploadedImages([
        {
          preview: initialImageUrl,
          slot: "default",
          sourceUrl: initialImageUrl,
        },
      ]);
    } else {
      setInitialUploadedImages([]);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [initialImageFile, initialImageUrl]);

  const generatorConfig = useMemo(
    () =>
      adaptToolPageConfigToGeneratorConfig(toolConfig, {
        prompt: initialPrompt,
        model: initialModelId,
        duration: initialDuration,
        aspectRatio: initialAspectRatio,
        quality: initialQuality,
        uploadedImages: initialUploadedImages,
        availableModelIds,
        defaultModelId,
        showImageUpload:
          toolType === "image-to-video" ||
          toolType === "reference-to-video" ||
          allowUnifiedInput,
      }),
    [
      allowUnifiedInput,
      availableModelIds,
      defaultModelId,
      initialAspectRatio,
      initialDuration,
      initialModelId,
      initialPrompt,
      initialQuality,
      initialUploadedImages,
      toolConfig,
      toolType,
    ]
  );

  const prefillKey = [
    toolType,
    initialPrompt ?? "",
    initialModelId ?? defaultModelId ?? "",
    initialDuration ?? "",
    initialAspectRatio ?? "",
    initialQuality ?? "",
    initialImageFile?.name ?? "",
    initialImageUrl ?? "",
  ].join(":");

  const handleSubmit = (data: SubmitData) => {
    const parsedDuration = Number.parseInt(data.duration ?? "", 10);

    onSubmit?.({
      toolType,
      model: data.model,
      prompt: data.prompt.trim(),
      duration: Number.isNaN(parsedDuration) ? initialDuration ?? 10 : parsedDuration,
      aspectRatio: data.aspectRatio,
      quality: data.resolution,
      imageFile: data.images?.[0],
      imageUrl: data.imageUrls?.[0],
      estimatedCredits: data.estimatedCredits,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,18,10,0.94),rgba(4,11,7,0.96))] p-5 text-white shadow-[0_26px_80px_rgba(0,0,0,0.34)]">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/72">
              {getPageTitle(toolType, tGenerator)}
            </h2>
            <p className="mt-1 text-xs text-white/42">{tTool("tipsLine1")}</p>
          </div>
        </div>

        <CompactGenerator
          key={prefillKey}
          config={generatorConfig}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          texts={{
            placeholder: tGenerator("promptPlaceholder"),
            videoModels: tGenerator("videoModels"),
            credits: tGenerator("creditsUnit"),
            settings: tGenerator("model"),
            aspectRatio: tGenerator("aspectRatio"),
            duration: tGenerator("videoLength"),
            resolution: tGenerator("resolution"),
            generate: tGenerator("generateVideo"),
            generating: tGenerator("generating"),
            generateAudio: "Audio",
            generateAudioDesc: "Generate synced audio when supported",
          }}
          className={cn(
            "[&_button]:transition",
            "[&_textarea]:placeholder:text-white/34",
            "[&_textarea]:text-white",
            "[&_.switch]:data-[state=checked]:bg-emerald-500"
          )}
        />
      </div>
    </div>
  );
}

function getPageTitle(
  toolType: GeneratorPanelProps["toolType"],
  t: (key: string) => string
) {
  if (toolType === "image-to-video") {
    return t("pageTitle.imageToVideo");
  }

  if (toolType === "reference-to-video") {
    return t("pageTitle.referenceToVideo");
  }

  return t("pageTitle.textToVideo");
}
