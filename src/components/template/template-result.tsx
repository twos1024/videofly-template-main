"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  RotateCcw,
  LayoutGrid,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface TemplateResultProps {
  status: "generating" | "completed" | "failed";
  type: "image" | "video";
  resultUrl?: string;
  error?: string;
  onRetry?: () => void;
  onBackToTemplates?: () => void;
}

export function TemplateResult({
  status,
  type,
  resultUrl,
  error,
  onRetry,
  onBackToTemplates,
}: TemplateResultProps) {
  const t = useTranslations("Templates");

  const handleDownload = async () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `pixelmuse-${Date.now()}.${type === "image" ? "png" : "mp4"}`;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-muted">
          {status === "generating" && (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">{t("generatingTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("generatingHint")}
                </p>
              </div>
            </div>
          )}

          {status === "completed" && resultUrl && (
            <>
              {type === "image" ? (
                <img
                  src={resultUrl}
                  alt={t("resultAlt")}
                  className="h-full w-full object-contain"
                />
              ) : (
                <video
                  src={resultUrl}
                  controls
                  className="h-full w-full object-contain"
                />
              )}
              <div className="absolute top-3 left-3">
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-sm text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("completedLabel")}
                </div>
              </div>
            </>
          )}

          {status === "failed" && (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div className="text-center">
                <p className="font-medium text-destructive">{t("failedLabel")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error ?? t("failedDefault")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-4">
          {status === "completed" && (
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              {t("downloadResult")}
            </Button>
          )}
          {(status === "completed" || status === "failed") && onRetry && (
            <Button variant="outline" onClick={onRetry} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t("retryGenerate")}
            </Button>
          )}
          {onBackToTemplates && (
            <Button
              variant="ghost"
              onClick={onBackToTemplates}
              className="gap-2 ml-auto"
            >
              <LayoutGrid className="h-4 w-4" />
              {t("switchTemplate")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
