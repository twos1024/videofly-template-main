"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  Clock3,
  ImagePlus,
  RefreshCw,
  SendHorizonal,
  Sparkles,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { DEFAULT_VIDEO_MODELS } from "@/components/video-generator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/ui";
import { calculateModelCredits } from "@/config/credits";
import { textToVideoConfig } from "@/config/tool-pages";
import { adaptToolPageConfigToGeneratorConfig } from "@/config/tool-pages/adapter";
import { useLocaleRouter } from "@/i18n/navigation";
import { saveToolPrefill } from "@/lib/tool-prefill";

const PROMPT_SUGGESTION_KEYS = [
  "prompt1",
  "prompt2",
  "prompt3",
  "prompt4",
  "prompt5",
  "prompt6",
] as const;

const modelMeta = new Map(DEFAULT_VIDEO_MODELS.map((model) => [model.id, model]));

interface SelectPillOption {
  value: string;
  label: string;
}

interface HeroModelOption {
  id: string;
  name: string;
  durations: number[];
  aspectRatios: string[];
}

interface SelectPillProps {
  icon?: ReactNode;
  value: string;
  options: SelectPillOption[];
  onSelect: (value: string) => void;
  className?: string;
  renderValue?: () => ReactNode;
}

function SelectPill({
  icon,
  value,
  options,
  onSelect,
  className,
  renderValue,
}: SelectPillProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 text-sm font-medium text-white/88 transition hover:border-emerald-400/30 hover:bg-white/8",
            className
          )}
        >
          {icon}
          <span>{renderValue ? renderValue() : options.find((option) => option.value === value)?.label}</span>
          <ChevronDown className="h-4 w-4 text-white/48" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[180px] rounded-2xl border border-white/10 bg-[#07110a]/95 text-white shadow-2xl backdrop-blur-xl"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              "cursor-pointer rounded-xl px-3 py-2 text-sm focus:bg-white/10 focus:text-white",
              option.value === value && "bg-white/8 text-white"
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HeroPromptStudio() {
  const t = useTranslations("Hero");
  const router = useLocaleRouter();
  const inputId = useId();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("sora-2");
  const [duration, setDuration] = useState(10);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [suggestionOffset, setSuggestionOffset] = useState(0);

  const generatorConfig = useMemo(
    () => adaptToolPageConfigToGeneratorConfig(textToVideoConfig, { showImageUpload: true }),
    []
  );
  const models: HeroModelOption[] = generatorConfig.videoModels
    .map((model) => ({
      id: model.id,
      name: model.name,
      durations: (model.durations ?? [])
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => !Number.isNaN(value)),
      aspectRatios: model.aspectRatios ?? generatorConfig.aspectRatios?.video ?? ["16:9"],
    }))
    .filter((model) => model.durations.length > 0);
  const currentModel =
    models.find((model) => model.id === selectedModel) ?? models[0];

  useEffect(() => {
    if (!currentModel) {
      return;
    }

    if (!models.some((model) => model.id === selectedModel)) {
      setSelectedModel(currentModel.id);
    }
  }, [currentModel, models, selectedModel]);

  useEffect(() => {
    if (!currentModel) {
      return;
    }

    if (!currentModel.durations.includes(duration)) {
      setDuration(currentModel.durations.includes(10) ? 10 : currentModel.durations[0] ?? 10);
    }

    if (!currentModel.aspectRatios.includes(aspectRatio)) {
      setAspectRatio(
        currentModel.aspectRatios.includes("16:9")
          ? "16:9"
          : currentModel.aspectRatios[0] ?? "16:9"
      );
    }
  }, [aspectRatio, currentModel, duration]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const estimatedCredits = currentModel
    ? calculateModelCredits(currentModel.id, { duration })
    : 0;

  const modelOptions = models.map((model) => ({
    value: model.id,
    label: model.name,
  }));
  const aspectOptions = (currentModel?.aspectRatios ?? ["16:9"]).map((value) => ({
    value,
    label: value,
  }));
  const durationOptions = (currentModel?.durations ?? [10]).map((value) => ({
    value: value.toString(),
    label: `${value}s`,
  }));

  const promptSuggestions = PROMPT_SUGGESTION_KEYS.map((key) =>
    t(`studio.suggestions.${key}`)
  );
  const visibleSuggestions = promptSuggestions.map(
    (_, index) => promptSuggestions[(index + suggestionOffset) % promptSuggestions.length]
  );

  const handleGenerate = () => {
    if (!prompt.trim()) {
      promptRef.current?.focus();
      return;
    }

    saveToolPrefill({
      prompt: prompt.trim(),
      model: currentModel?.id,
      duration,
      aspectRatio,
      imageFile,
    });
    router.push("/create/video");
  };

  const handleSelectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(t("studio.errors.invalidImageType"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("studio.errors.imageTooLarge"));
      return;
    }

    setImageFile(file);
    event.target.value = "";
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,18,10,0.94),rgba(4,11,7,0.96))] p-5 shadow-[0_40px_160px_rgba(2,6,3,0.7)] md:p-7">
        <div className="pointer-events-none absolute inset-x-[20%] top-0 h-36 rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-36 w-36 rounded-full bg-emerald-400/8 blur-3xl" />

        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex gap-4">
              <input
                id={inputId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleSelectImage}
              />
              <label
                htmlFor={inputId}
                className="group flex h-28 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] transition hover:border-emerald-400/40 hover:bg-white/[0.05] md:h-32 md:w-28"
              >
                {previewUrl ? (
                  <div className="relative h-full w-full">
                    <img
                      src={previewUrl}
                      alt={imageFile?.name ?? t("studio.imageAlt")}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setImageFile(null);
                      }}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/45 transition group-hover:text-white/75">
                    <ImagePlus className="h-7 w-7" />
                    <span className="text-xs">{t("studio.addImage")}</span>
                  </div>
                )}
              </label>
            </div>

            <div className="min-h-[160px] flex-1 rounded-[28px] border border-white/6 bg-black/10 p-1">
              <textarea
                ref={promptRef}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder={t("studio.placeholder")}
                className="h-full min-h-[150px] w-full resize-none rounded-[24px] bg-transparent px-5 py-4 text-base leading-7 text-white placeholder:text-white/38 focus:outline-none md:text-[1.08rem]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-12 items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 text-sm font-medium text-white/88">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <span>{t("studio.mode")}</span>
              </div>

              <SelectPill
                value={selectedModel}
                options={modelOptions}
                onSelect={setSelectedModel}
                renderValue={() => (
                  <span className="inline-flex items-center gap-2">
                    <ModelIcon modelId={selectedModel} modelName={currentModel?.name ?? "Model"} />
                    <span>{currentModel?.name ?? "Sora 2"}</span>
                  </span>
                )}
              />

              <SelectPill
                icon={<span className="text-sm text-white/48">◧</span>}
                value={aspectRatio}
                options={aspectOptions}
                onSelect={setAspectRatio}
              />

              <SelectPill
                icon={<Clock3 className="h-4 w-4 text-white/48" />}
                value={duration.toString()}
                options={durationOptions}
                onSelect={(value) => setDuration(Number(value))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 sm:justify-end">
              <div className="px-3 text-sm text-white/58">
                <span className="mr-2 text-white/82">{estimatedCredits}</span>
                {t("studio.creditLabel")}
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-black shadow-[0_18px_40px_rgba(34,197,94,0.35)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 disabled:shadow-none"
              >
                <SendHorizonal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setSuggestionOffset((current) => (current + 1) % promptSuggestions.length)
          }
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-white/62 transition hover:border-emerald-400/30 hover:text-white"
          aria-label={t("studio.shufflePrompts")}
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {visibleSuggestions.slice(0, 5).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setPrompt(suggestion)}
            className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 transition hover:border-emerald-400/30 hover:bg-white/[0.05] hover:text-white"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <p className="mt-5 text-center text-sm text-white/42">
        {t("studio.freeCreditsHint")}
      </p>
    </div>
  );
}

function ModelIcon({
  modelId,
  modelName,
}: {
  modelId: string;
  modelName: string;
}) {
  const meta = modelMeta.get(modelId);
  const icon = meta?.icon;

  if (
    typeof icon === "string" &&
    (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/"))
  ) {
    return <img src={icon} alt={modelName} className="h-5 w-5 rounded-full object-cover" />;
  }

  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/12 text-[10px] font-bold text-white">
      {modelName.charAt(0).toUpperCase()}
    </span>
  );
}
