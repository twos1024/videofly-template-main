"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Loader2, Image as ImageIcon } from "lucide-react";
import { getAvailableImageModels } from "@/config/credits";
import { cn } from "@/lib/utils";
import { TemplateResult } from "./template-result";

const imageModels = getAvailableImageModels();
const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

interface GenerationState {
  status: "generating" | "completed" | "failed";
  url?: string;
  error?: string;
}

export function FreeImageGenerator() {
  const t = useTranslations("ImageGenerator");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(imageModels[0]?.id ?? "flux-1");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationState | null>(null);

  const selectedModel = imageModels.find((m) => m.id === model);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult({ status: "generating" });

    try {
      const res = await fetch("/api/v1/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, aspectRatio }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        const errData = data.error as Record<string, unknown> | undefined;
        throw new Error((errData?.message as string) ?? t("errorGenerate"));
      }

      const data = await res.json() as { data?: { imageUuid?: string } };
      const uuid = data.data?.imageUuid;
      if (!uuid) throw new Error(t("errorNoTask"));

      let settled = false;
      for (let i = 0; i < 60; i++) {
        await new Promise<void>((r) => setTimeout(r, 3000));
        try {
          const statusRes = await fetch(`/api/v1/image/${uuid}/status`);
          if (!statusRes.ok) continue;
          const statusData = await statusRes.json() as {
            data?: { status?: string; imageUrl?: string; error?: string };
          };
          const status = statusData.data?.status;
          if (status === "COMPLETED") {
            setResult({ status: "completed", url: statusData.data?.imageUrl });
            settled = true;
            break;
          }
          if (status === "FAILED") {
            setResult({ status: "failed", error: statusData.data?.error ?? t("errorFailed") });
            settled = true;
            break;
          }
        } catch {
          // 继续轮询
        }
      }

      if (!settled) {
        setResult({ status: "failed", error: t("errorTimeout") });
      }
    } catch (err) {
      setResult({
        status: "failed",
        error: err instanceof Error ? err.message : t("errorFailed"),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (result) {
    return (
      <TemplateResult
        status={result.status}
        type="image"
        resultUrl={result.url}
        error={result.error}
        onRetry={() => setResult(null)}
        onBackToTemplates={() => {
          window.location.href = "/create";
        }}
      />
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg">{t("promptLabel")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <textarea
          className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={t("promptPlaceholder")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("modelLabel")}</label>
          <div className="flex flex-wrap gap-2">
            {imageModels.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModel(m.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-all",
                  model === m.id
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:border-primary/30"
                )}
              >
                {m.name} ({m.creditCost} {t("creditsLabel")})
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("ratioLabel")}</label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAspectRatio(r)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-all",
                  aspectRatio === r
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:border-primary/30"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Gem className="h-4 w-4" />
            {t("costLabel")} {selectedModel?.creditCost ?? 1} {t("costSuffix")}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="gap-2 min-w-[120px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                {t("startGenerate")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
