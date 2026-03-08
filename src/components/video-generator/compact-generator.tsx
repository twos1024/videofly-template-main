/**
 * CompactGenerator Component
 *
 * 紧凑形态的生成器组件，用于工具页面左侧的 GeneratorPanel
 * 基于 VideoGeneratorCore，仅显示核心控件
 *
 * @module compact-generator
 */

"use client";

import * as React from "react";
import {
  ChevronDown,
  Send,
  Loader2,
  Clock,
  ExternalLink,
  Monitor,
  MoreHorizontal,
  X,
  Plus,
  Volume2,
} from "lucide-react";
import { cn } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import type { OutputNumberOption } from "./types";
import {
  VideoGeneratorCore,
  useVideoGeneratorCore,
  type VideoGeneratorCoreConfig,
} from "./video-generator-core";

// ============================================================================
// Types
// ============================================================================

export interface CompactGeneratorProps {
  // 配置
  config: VideoGeneratorCoreConfig;

  // 用户状态
  isPro?: boolean;
  isLoading?: boolean;
  disabled?: boolean;

  // 积分
  estimatedCredits?: number;

  // 回调
  onSubmit?: (data: any) => void;
  onChange?: (data: any) => void;
  onModelChange?: (modelId: string, type: string) => void;
  onPromptChange?: (prompt: string) => void;
  onImageUpload?: (files: File[], slot: string) => void;
  onImageRemove?: (slot: string) => void;
  onProFeatureClick?: (feature: string) => void;

  // 多语言
  texts?: {
    placeholder?: string;
    credits?: string;
    settings?: string;
    videoModels?: string;
    imageModels?: string;
    aspectRatio?: string;
    duration?: string;
    resolution?: string;
    outputNumber?: string;
    generateAudio?: string;
    generateAudioDesc?: string;
    generate?: string;
    generating?: string;
  };

  // 样式
  className?: string;
}

type QuickSettingChip = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

// ============================================================================
// Sub-Components
// ============================================================================

function AspectRatioGlyph({
  ratio,
  compact = false,
}: {
  ratio: string;
  compact?: boolean;
}) {
  const frameClassName = {
    "16:9": compact ? "h-2.5 w-5.5" : "h-5 w-11",
    "9:16": compact ? "h-5.5 w-2.5" : "h-11 w-5",
    "1:1": compact ? "h-4 w-4" : "h-8 w-8",
    "4:3": compact ? "h-3.5 w-4.5" : "h-7 w-9",
    "3:4": compact ? "h-4.5 w-3.5" : "h-9 w-7",
    "21:9": compact ? "h-2 w-6" : "h-4 w-12",
  }[ratio] ?? (compact ? "h-3 w-4.5" : "h-6 w-9");

  return (
    <div className={cn("flex items-center justify-center", compact ? "h-4" : "h-11")}>
      <div
        className={cn(
          "rounded-[10px] border border-current/80 bg-transparent transition-colors",
          frameClassName
        )}
      />
    </div>
  );
}

function SettingSection({
  title,
  columns,
  children,
}: {
  title: string;
  columns: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-white/74">{title}</div>
      <div className={cn("grid gap-3", columns)}>{children}</div>
    </div>
  );
}

/**
 * CompactRenderer - 紧凑模式的实际渲染组件
 */
function CompactRenderer() {
  const {
    config,
    features,
    texts,
    state,
    computed,
    validation,
    actions,
    handlers,
    refs,
    calculatedCredits,
    isLoading,
    isPro,
  } = useVideoGeneratorCore();

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // 检查是否显示类型切换
  const showTypeSwitch = features.showGenerationTypeSwitch !== false &&
    config.videoModels.length > 0 &&
    config.imageModels.length > 0;

  // 检查是否显示模式选择器
  const showModeSelector = features.showModeSelector !== false &&
    (state.generationType === "video" ? config.videoModes : config.imageModes).length > 0;

  // 检查是否显示图片上传
  const showImageUpload = features.showImageUpload !== false;

  // 检查是否显示提示词输入
  const showPromptInput = features.showPromptInput !== false;

  // 检查是否显示设置
  const showSettings = features.showSettings !== false;

  // 检查是否显示高级设置
  const showAdvancedSettings = features.showAdvancedSettings !== false;

  // 辅助函数：检查图标是否为 URL
  const isIconUrl = (icon: string) => {
    return icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/");
  };

  // 辅助函数：获取模型图标
  const getModelIcon = (model: any) => {
    return model.icon ?? model.name.charAt(0).toUpperCase();
  };

  // 辅助函数：获取模型颜色
  const getModelColor = (model: any) => {
    return model.color ?? "#71717a";
  };

  // 渲染模型图标
  const renderModelIcon = (model: any) => {
    const icon = getModelIcon(model);
    const color = getModelColor(model);

    if (isIconUrl(icon)) {
      return (
        <img
          src={icon}
          alt={model.name}
          className="w-4 h-4 rounded object-cover"
        />
      );
    }

    return (
      <span
        className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold"
        style={{ backgroundColor: color, color: "#fff" }}
      >
        {icon}
      </span>
    );
  };

  const quickSettingChips = React.useMemo(() => {
    const chips: QuickSettingChip[] = [];

    if (computed.currentAspectRatio) {
      chips.push({
        id: "aspect-ratio",
        label: computed.currentAspectRatio,
        icon: <AspectRatioGlyph ratio={computed.currentAspectRatio} compact />,
      });
    }

    if (state.generationType === "video" && computed.showDurationControl) {
      chips.push({
        id: "duration",
        label: state.duration,
        icon: <Clock className="h-4 w-4 text-white/58" />,
      });
    }

    if (state.generationType === "video" && computed.showResolutionControl) {
      chips.push({
        id: "resolution",
        label: state.resolution,
        icon: <Monitor className="h-4 w-4 text-white/58" />,
      });
    }

    return chips;
  }, [
    computed.currentAspectRatio,
    computed.showDurationControl,
    computed.showResolutionControl,
    state.duration,
    state.generationType,
    state.resolution,
  ]);

  return (
    <div className="flex flex-col gap-4">
      {/* 隐藏的文件输入 */}
      <input
        ref={refs.fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlers.handleImageUpload}
        className="hidden"
      />

      {/* 输入区域 */}
      <div className="rounded-[26px] border border-white/8 bg-black/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        {/* 上传和输入行 */}
        <div className="flex gap-3">
          {/* 图片上传区域 */}
          {showImageUpload && computed.uploadSlots.map((slot) => {
            const image = handlers.getImageForSlot(slot.id);
            return (
              <div key={slot.id} className="flex flex-col items-center gap-1">
                {image ? (
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => handlers.handleRemoveImage(slot.id)}
                      className="absolute -top-1 -right-1 z-10 rounded-full bg-black/70 p-0.5 opacity-0 transition-opacity hover:bg-black/90 group-hover:opacity-100"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                    <div className="h-12 w-10 rounded-lg border border-white/12 bg-white/[0.04] p-0.5">
                      <div className="relative w-full h-full rounded overflow-hidden">
                        <img
                          src={image.preview}
                          alt={slot.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlers.handleUploadClick(slot.id)}
                    className="flex h-12 w-10 items-center justify-center rounded-lg border border-dashed border-white/12 text-white/34 transition-colors hover:border-emerald-400/40 hover:text-white/70"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          {/* 提示词输入 */}
          {showPromptInput && (
            <div className="flex-1 min-h-[48px]">
              <textarea
                value={state.prompt}
                onChange={(e) => {
                  actions.setPrompt(e.target.value);
                }}
                onKeyDown={handlers.handleKeyDown}
                placeholder={texts.placeholder ?? texts.videoPlaceholder}
                disabled={isLoading}
                className={cn(
                  "h-full max-h-[120px] min-h-[48px] w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none placeholder:text-white/34",
                  validation.promptError ? "text-red-400" : "text-white",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                rows={2}
              />
            </div>
          )}
        </div>

        {/* 字符计数和错误 */}
        {(validation.showCharCount || validation.promptError) && (
          <div
            className={cn(
              "text-xs mt-1 text-right",
              validation.promptError ? "text-red-400" : "text-white/36"
            )}
          >
            {validation.charCount}
          </div>
        )}
      </div>

      {/* 控制栏 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 模型选择器 */}
        {features.showModelSelector !== false && computed.currentModel && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex min-w-[180px] items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-left text-xs text-white/76 transition-colors hover:border-emerald-400/30 hover:bg-white/[0.06]"
              >
                {renderModelIcon(computed.currentModel)}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white/88">
                    {computed.currentModel.name}
                  </div>
                  <div className="truncate text-[10px] uppercase tracking-[0.18em] text-white/34">
                    {computed.currentModel.vendor ?? "Model"}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 shrink-0 text-white/40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[360px] w-[320px] overflow-y-auto rounded-[28px] border border-white/10 bg-[#07110a]/95 p-1.5 text-white shadow-2xl backdrop-blur-xl">
              <DropdownMenuLabel className="px-3 pt-2 text-xs text-white/42">
                {state.generationType === "video" ? texts.videoModels : texts.imageModels}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/8" />
              {computed.availableModels.map((model: any) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => {
                    if (state.generationType === "video") {
                      actions.setVideoModel(model);
                    } else {
                      actions.setImageModel(model);
                    }
                  }}
                  className="rounded-[22px] px-3 py-3 text-white/76 focus:bg-white/10 focus:text-white"
                >
                  <div className="flex w-full items-start gap-3">
                    <div className="mt-0.5">{renderModelIcon(model)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-white/88">
                          {model.name}
                        </span>
                        {computed.currentModel?.id === model.id && (
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/34">
                        {model.vendor ?? "Model"}
                      </div>
                      {model.description && (
                        <div className="mt-1 text-xs leading-5 text-white/46">
                          {model.description}
                        </div>
                      )}
                      {model.officialName && model.officialName !== model.name && (
                        <div className="mt-1 text-[11px] text-emerald-300/70">
                          {model.officialName}
                        </div>
                      )}
                    </div>
                    {model.docsUrl && (
                      <a
                        href={model.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-full border border-white/10 p-2 text-white/42 transition-colors hover:border-emerald-400/30 hover:text-white/82"
                        title={`Open ${model.name} on ${model.vendor ?? "the model page"}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 快速设置摘要和按钮 */}
        {showSettings && quickSettingChips.length > 0 && (
          <>
            <div className="flex h-12 items-center rounded-full border border-white/8 bg-white/[0.04] pl-3 pr-4 text-xs text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              {quickSettingChips.map((chip, index) => (
                <React.Fragment key={chip.id}>
                  {index > 0 && <div className="mx-3 h-5 w-px bg-white/10" />}
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 items-center justify-center text-white/58">
                      {chip.icon}
                    </div>
                    <span className="text-[12px] font-medium text-white/72">
                      {chip.label}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-white/56 transition-colors hover:border-emerald-400/30 hover:bg-white/[0.06] hover:text-white/82"
                  aria-label={texts.settings ?? "Settings"}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(860px,calc(100vw-2rem))] rounded-[28px] border border-white/10 bg-[#0b1016]/96 p-5 text-white shadow-2xl backdrop-blur-xl"
                align="start"
                sideOffset={12}
              >
                <div className="space-y-6">
                  <SettingSection
                    title={texts.aspectRatio ?? "Aspect Ratio"}
                    columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                  >
                    {(state.generationType === "video"
                      ? computed.effectiveVideoAspectRatios
                      : computed.effectiveImageAspectRatios
                    ).map((ratio: string) => (
                      <button
                        type="button"
                        key={ratio}
                        onClick={() => handlers.handleAspectRatioChange(ratio)}
                        className={cn(
                          "flex min-h-[112px] flex-col items-center justify-center rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-5 text-white/60 transition-all hover:border-white/14 hover:bg-white/[0.07] hover:text-white/88",
                          computed.currentAspectRatio === ratio &&
                            "border-emerald-300/55 bg-white/[0.12] text-white shadow-[0_0_0_1px_rgba(110,231,183,0.18)]"
                        )}
                      >
                        <AspectRatioGlyph ratio={ratio} />
                        <span className="mt-3 text-[15px] font-medium">{ratio}</span>
                      </button>
                    ))}
                  </SettingSection>

                  {state.generationType === "video" && computed.showDurationControl && (
                    <SettingSection
                      title={texts.duration ?? "Video Length"}
                      columns={cn(
                        computed.effectiveDurations.length <= 2
                          ? "grid-cols-2"
                          : "grid-cols-2 md:grid-cols-3"
                      )}
                    >
                      {computed.effectiveDurations.map((d: string) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => actions.setDuration(d)}
                          className={cn(
                            "rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-5 text-lg font-medium text-white/58 transition-all hover:border-white/14 hover:bg-white/[0.07] hover:text-white/88",
                            state.duration === d &&
                              "border-emerald-300/55 bg-white/[0.12] text-white shadow-[0_0_0_1px_rgba(110,231,183,0.18)]"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </SettingSection>
                  )}

                  {state.generationType === "video" && computed.showResolutionControl && (
                    <SettingSection
                      title={texts.resolution ?? "Resolution"}
                      columns={cn(
                        computed.effectiveResolutions.length <= 2
                          ? "grid-cols-2"
                          : "grid-cols-2 md:grid-cols-3"
                      )}
                    >
                      {computed.effectiveResolutions.map((r: string) => (
                        <button
                          type="button"
                          key={r}
                          onClick={() => actions.setResolution(r)}
                          className={cn(
                            "rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-5 text-lg font-medium text-white/58 transition-all hover:border-white/14 hover:bg-white/[0.07] hover:text-white/88",
                            state.resolution === r &&
                              "border-emerald-300/55 bg-white/[0.12] text-white shadow-[0_0_0_1px_rgba(110,231,183,0.18)]"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </SettingSection>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* 生成按钮 */}
        <button
          type="button"
          onClick={handlers.handleSubmit}
          disabled={!validation.canSubmit}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all",
            validation.canSubmit
              ? "bg-emerald-500 text-black shadow-[0_14px_32px_rgba(34,197,94,0.22)] hover:bg-emerald-400"
              : "cursor-not-allowed bg-white/[0.05] text-white/28"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              {texts.generating ?? "Generating..."}
            </>
          ) : (
            <>
              <Send className="w-3 h-3" />
              {texts.generate ?? "Generate"}
            </>
          )}
          <span className="text-black/35">•</span>
          <span>{calculatedCredits} {texts.credits}</span>
        </button>
      </div>

      {/* 高级设置（仅显示需要时） */}
      {showAdvancedSettings && (computed.effectiveVideoOutputNumbers.length > 1 || computed.modelSupportsAudio) && (
        <div className="flex items-center gap-3 border-t border-white/8 pt-2">
          {/* 输出数量 */}
          {computed.effectiveVideoOutputNumbers.length > 1 && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-white/44">{texts.outputNumber}</Label>
              <div className="flex gap-1">
                {computed.effectiveVideoOutputNumbers.map((option: OutputNumberOption) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handlers.handleOutputNumberChange(option)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs transition-colors",
                      computed.currentOutputNumber === option.value
                        ? "bg-emerald-500 text-black"
                        : "bg-white/[0.05] text-white/56 hover:bg-white/[0.08]",
                      option.isPro && !isPro && "opacity-70"
                    )}
                  >
                    {option.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 生成音频（仅视频且模型支持时） */}
          {computed.modelSupportsAudio && (
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-white/40" />
              <Label className="text-xs text-white/72">{texts.generateAudio ?? "Audio"}</Label>
              <Switch
                checked={state.generateAudio}
                onCheckedChange={actions.setGenerateAudio}
                className="scale-75"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CompactGenerator Component
// ============================================================================

/**
 * CompactGenerator - 紧凑形态的生成器组件
 *
 * 用于工具页面左侧的 GeneratorPanel
 *
 * @example
 * ```tsx
 * <CompactGenerator
 *   config={toolPageConfig.generator}
 *   isPro={user.isPro}
 *   isLoading={isGenerating}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function CompactGenerator({
  config,
  isPro = false,
  isLoading = false,
  disabled = false,
  estimatedCredits,
  onSubmit,
  onChange,
  onModelChange,
  onPromptChange,
  onImageUpload,
  onImageRemove,
  onProFeatureClick,
  texts,
  className,
}: CompactGeneratorProps) {
  return (
    <VideoGeneratorCore
      config={config}
      uiMode="compact"
      features={{
        showGenerationTypeSwitch: false, // 紧凑模式通常不需要类型切换
        showModeSelector: true,
        showModelSelector: true,
        showImageUpload: true,
        showPromptInput: true,
        showSettings: true,
        showAdvancedSettings: true,
        showPromptSuggestions: false,
      }}
      isPro={isPro}
      isLoading={isLoading}
      disabled={disabled}
      estimatedCredits={estimatedCredits}
      onSubmit={onSubmit}
      onChange={onChange}
      onModelChange={onModelChange}
      onPromptChange={onPromptChange}
      onImageUpload={onImageUpload}
      onImageRemove={onImageRemove}
      onProFeatureClick={onProFeatureClick}
      texts={texts}
      className={className}
    >
      <CompactRenderer />
    </VideoGeneratorCore>
  );
}

export default CompactGenerator;
