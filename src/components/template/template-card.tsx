"use client";

import { useTranslations } from "next-intl";
import { type SceneTemplate } from "@/config/templates";
import { localizeTemplate } from "@/hooks/use-localized-template";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Gem, Image, Video } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

interface TemplateCardProps {
  template: SceneTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const t = useTranslations("Templates");
  const tData = useTranslations("TemplateData");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const loc = localizeTemplate(template, tData);

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
      tabIndex={0}
      aria-label={loc.name}
      onClick={() => router.push(`/${locale}/create/${template.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/${locale}/create/${template.id}`);
        }
      }}
    >
      {/* 封面图区域 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
        {template.coverImage ? (
          <img
            src={template.coverImage}
            alt={loc.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            {template.type === "image" ? (
              <Image className="h-12 w-12 text-primary/40" />
            ) : (
              <Video className="h-12 w-12 text-primary/40" />
            )}
          </div>
        )}
        {/* 类型标签 */}
        <div className="absolute top-3 left-3 z-20">
          <Badge
            variant="secondary"
            className="bg-black/40 text-white backdrop-blur-sm border-0 text-xs"
          >
            {template.type === "image" ? t("imageType") : t("videoType")}
          </Badge>
        </div>
        {/* 积分消耗 */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1">
          <Badge
            variant="secondary"
            className="bg-black/40 text-white backdrop-blur-sm border-0 text-xs"
          >
            <Gem className="mr-1 h-3 w-3" />
            {template.credits}
          </Badge>
        </div>
        {/* 难度标识 */}
        {template.difficulty === "easy" && (
          <div className="absolute top-3 right-3 z-20">
            <Badge
              variant="secondary"
              className="bg-emerald-500/80 text-white backdrop-blur-sm border-0 text-xs"
            >
              {t("beginnerFriendly")}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground truncate">{loc.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {loc.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {loc.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-normal px-2 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
