"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type SceneTemplate } from "@/config/templates";
import { TemplateWizard } from "./template-wizard";
import { TemplateResult } from "./template-result";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface TemplateWizardPageProps {
  template: SceneTemplate;
}

export function TemplateWizardPage({ template }: TemplateWizardPageProps) {
  const t = useTranslations("Templates");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [phase, setPhase] = useState<"wizard" | "generating" | "result">("wizard");
  const [resultStatus, setResultStatus] = useState<"generating" | "completed" | "failed">("generating");
  const [resultUrl, setResultUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const pollAbortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const stopActivePolling = () => {
    if (pollAbortControllerRef.current) {
      pollAbortControllerRef.current.abort();
      pollAbortControllerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopActivePolling();
    };
  }, []);

  const handleGenerate = async (prompt: string, tmpl: SceneTemplate) => {
    stopActivePolling();
    const controller = new AbortController();
    pollAbortControllerRef.current = controller;

    setPhase("generating");
    setResultStatus("generating");
    setIsGenerating(true);

    try {
      const endpoint =
        tmpl.type === "image" ? "/api/v1/image/generate" : "/api/v1/video/generate";

      const body: Record<string, unknown> = {
        prompt,
        model: tmpl.presets.model,
        aspectRatio: tmpl.presets.aspectRatio,
        templateId: tmpl.id,
      };

      if (tmpl.type === "video" && tmpl.presets.duration) {
        body.duration = tmpl.presets.duration;
      }

      if (tmpl.presets.quality) {
        body.quality = tmpl.presets.quality;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        const errData = data.error as Record<string, unknown> | undefined;
        throw new Error((errData?.message as string) || t("errorRequestFailed"));
      }

      const data = await res.json() as { data?: { imageUuid?: string; videoUuid?: string } };
      const uuid = data.data?.imageUuid ?? data.data?.videoUuid;

      if (!uuid) {
        throw new Error(t("errorNoTaskId"));
      }

      const statusEndpoint =
        tmpl.type === "image"
          ? `/api/v1/image/${uuid}/status`
          : `/api/v1/video/${uuid}/status`;

      let settled = false;
      for (let i = 0; i < 60; i++) {
        if (controller.signal.aborted || !mountedRef.current) {
          return;
        }
        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            clearTimeout(timer);
            controller.signal.removeEventListener("abort", onAbort);
          };
          const onAbort = () => {
            cleanup();
            reject(new Error("aborted"));
          };
          const timer = setTimeout(() => {
            cleanup();
            resolve();
          }, 3000);
          controller.signal.addEventListener("abort", onAbort);
        });

        if (controller.signal.aborted || !mountedRef.current) {
          return;
        }
        try {
          const statusRes = await fetch(statusEndpoint, { signal: controller.signal });
          if (!statusRes.ok) continue;
          const statusData = await statusRes.json() as {
            data?: { status?: string; imageUrl?: string; videoUrl?: string; error?: string };
          };
          const status = statusData.data?.status;

          if (status === "COMPLETED") {
            const url = statusData.data?.imageUrl ?? statusData.data?.videoUrl;
            if (!mountedRef.current || controller.signal.aborted) {
              return;
            }
            setResultUrl(url);
            setResultStatus("completed");
            setPhase("result");
            settled = true;
            break;
          }
          if (status === "FAILED") {
            if (!mountedRef.current || controller.signal.aborted) {
              return;
            }
            setError(statusData.data?.error ?? t("errorFailed"));
            setResultStatus("failed");
            setPhase("result");
            settled = true;
            break;
          }
        } catch {
          // 继续轮询
        }
      }

      if (!settled && mountedRef.current && !controller.signal.aborted) {
        setError(t("errorTimeout"));
        setResultStatus("failed");
        setPhase("result");
      }
    } catch (err) {
      if (!mountedRef.current || controller.signal.aborted) {
        return;
      }
      setError(err instanceof Error ? err.message : t("errorFailed"));
      setResultStatus("failed");
      setPhase("result");
    } finally {
      if (pollAbortControllerRef.current === controller) {
        pollAbortControllerRef.current = null;
      }
      if (mountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleRetry = () => {
    stopActivePolling();
    setPhase("wizard");
    setResultUrl(undefined);
    setError(undefined);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/${locale}/create`)}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToList")}
      </Button>

      {phase === "wizard" && (
        <TemplateWizard
          template={template}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      )}

      {(phase === "generating" || phase === "result") && (
        <TemplateResult
          status={resultStatus}
          type={template.type}
          resultUrl={resultUrl}
          error={error}
          onRetry={handleRetry}
          onBackToTemplates={() => router.push(`/${locale}/create`)}
        />
      )}
    </div>
  );
}
