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
  X,
  Plus,
  Volume2,
  Settings,
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
import { Slider } from "@/components/ui/slider";
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

// ============================================================================
// Sub-Components
// ============================================================================

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
              <button type="button" className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/76 transition-colors hover:border-emerald-400/30 hover:bg-white/[0.06]">
                {renderModelIcon(computed.currentModel)}
                <span className="max-w-[80px] truncate">{computed.currentModel.name}</span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[320px] w-64 overflow-y-auto rounded-3xl border border-white/10 bg-[#07110a]/95 p-1 text-white shadow-2xl backdrop-blur-xl">
              <DropdownMenuLabel className="text-xs text-white/42">
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
                  className="flex flex-col items-start rounded-2xl py-2 text-white/76 focus:bg-white/10 focus:text-white"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {renderModelIcon(model)}
                      <span className="text-sm">{model.name}</span>
                    </div>
                    {computed.currentModel?.id === model.id && (
                      <div className="h-1 w-1 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  {model.description && (
                    <div className="ml-6 mt-0.5 text-[10px] text-white/34">{model.description}</div>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 快速设置按钮 */}
        {showSettings && (
          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/56 transition-colors hover:border-emerald-400/30 hover:bg-white/[0.06] hover:text-white/80">
                <Settings className="w-3.5 h-3.5" />
                <span>{texts.settings ?? "Settings"}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 rounded-3xl border border-white/10 bg-[#07110a]/95 p-3 text-white shadow-2xl backdrop-blur-xl" align="start">
              {/* 宽高比 */}
              <div className="mb-3">
                <Label className="mb-1.5 block text-xs text-white/44">{texts.aspectRatio}</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {computed.currentAspectRatio &&
                    (state.generationType === "video"
                      ? computed.effectiveVideoAspectRatios
                      : computed.effectiveImageAspectRatios
                    ).map((ratio: string) => (
                      <button
                        type="button"
                        key={ratio}
                        onClick={() => handlers.handleAspectRatioChange(ratio)}
                        className={cn(
                          "px-2 py-1.5 rounded text-xs transition-colors",
                          computed.currentAspectRatio === ratio
                            ? "bg-emerald-500 text-black"
                            : "bg-white/[0.05] text-white/56 hover:bg-white/[0.08]"
                        )}
                      >
                        {ratio}
                      </button>
                    ))}
                </div>
              </div>

              {/* 时长（仅视频） */}
              {state.generationType === "video" && computed.showDurationControl && (
                <div className="mb-3">
                  <Label className="mb-1.5 block text-xs text-white/44">{texts.duration}</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {computed.effectiveDurations.map((d: string) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => actions.setDuration(d)}
                        className={cn(
                          "px-2 py-1.5 rounded text-xs transition-colors",
                          state.duration === d
                            ? "bg-emerald-500 text-black"
                            : "bg-white/[0.05] text-white/56 hover:bg-white/[0.08]"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 分辨率（仅视频） */}
              {state.generationType === "video" && computed.showResolutionControl && (
                <div>
                  <Label className="mb-1.5 block text-xs text-white/44">{texts.resolution}</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {computed.effectiveResolutions.map((r: string) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => actions.setResolution(r)}
                        className={cn(
                          "px-2 py-1.5 rounded text-xs transition-colors",
                          state.resolution === r
                            ? "bg-emerald-500 text-black"
                            : "bg-white/[0.05] text-white/56 hover:bg-white/[0.08]"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
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
