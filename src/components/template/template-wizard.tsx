"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type SceneTemplate } from "@/config/templates";
import { localizeTemplate } from "@/hooks/use-localized-template";
import { fillTemplate } from "@/lib/template-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Gem,
  Loader2,
  Image,
  Video,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateWizardProps {
  template: SceneTemplate;
  onGenerate: (prompt: string, template: SceneTemplate) => Promise<void>;
  isGenerating?: boolean;
}

const STEPS = [
  { id: 1, labelKey: "stepOverview" as const },
  { id: 2, labelKey: "stepFill" as const },
  { id: 3, labelKey: "stepConfirm" as const },
];

export function TemplateWizard({
  template,
  onGenerate,
  isGenerating = false,
}: TemplateWizardProps) {
  const t = useTranslations("Templates");
  const tData = useTranslations("TemplateData");
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});

  const loc = localizeTemplate(template, tData);

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = (): boolean => {
    if (step === 2) {
      return template.variables
        .filter((v) => v.required)
        .every((v) => values[v.key]?.trim());
    }
    return true;
  };

  const finalPrompt = fillTemplate(template, values);

  const handleGenerate = async () => {
    await onGenerate(finalPrompt, template);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all",
                step > s.id
                  ? "bg-primary text-primary-foreground"
                  : step === s.id
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
            </div>
            <span
              className={cn(
                "text-sm hidden sm:inline",
                step >= s.id ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t(s.labelKey)}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-px w-8 sm:w-12",
                  step > s.id ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 模板介绍 */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                {template.type === "image" ? (
                  <Image className="h-7 w-7 text-primary" />
                ) : (
                  <Video className="h-7 w-7 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{loc.name}</h2>
                <p className="mt-1 text-muted-foreground">{loc.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {template.type === "image" ? t("imageType") : t("videoType")}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Gem className="h-3 w-3" /> {template.credits} {t("credits")}
                  </Badge>
                  {template.difficulty === "easy" && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                      {t("beginnerFriendly")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {loc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {loc.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: 填写变量 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("fillTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {loc.variables.map((variable) => (
              <div key={variable.key} className="space-y-2">
                <label className="text-sm font-medium">
                  {variable.label}
                  {variable.required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </label>
                {variable.type === "select" && variable.options ? (
                  <div className="flex flex-wrap gap-2">
                    {variable.options.map((opt, optIdx) => {
                      const originalValue = variable.originalOptions?.[optIdx] ?? opt;
                      return (
                        <button
                          key={originalValue}
                          onClick={() => updateValue(variable.key, originalValue)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm transition-all",
                            values[variable.key] === originalValue
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-primary/30 hover:bg-muted",
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Input
                    placeholder={variable.placeholder}
                    value={values[variable.key] ?? ""}
                    onChange={(e) => updateValue(variable.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: 确认生成 */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("confirmTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t("confirmDesc")}
              </p>
              <p className="text-sm leading-relaxed">{finalPrompt}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("paramsTitle")}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{t("paramModel")} {template.presets.model}</span>
                  <span>{t("paramRatio")} {template.presets.aspectRatio}</span>
                  {template.presets.duration && (
                    <span>{t("paramDuration")} {template.presets.duration}s</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-primary font-bold text-lg">
                <Gem className="h-5 w-5" />
                {template.credits}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 导航按钮 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("prevStep")}
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            {t("nextStep")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2 min-w-[140px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                {template.type === "image" ? (
                  <Image className="h-4 w-4" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                {t("startGenerate")}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
