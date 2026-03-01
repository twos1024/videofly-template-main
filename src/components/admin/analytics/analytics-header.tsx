"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeRange = "today" | "7d" | "30d" | "90d" | "all";

interface AnalyticsHeaderProps {
  title?: string;
  description?: string;
}

export function AnalyticsHeader({
  title,
  description,
}: AnalyticsHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Admin");
  const currentRange = (searchParams.get("range") as TimeRange) || "30d";

  const handleRangeChange = (value: TimeRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title ?? t("analytics.title")}</h1>
        <p className="text-muted-foreground">{description ?? t("analytics.description")}</p>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="time-range" className="text-sm font-medium">
          {t("analytics.timeRange")}
        </label>
        <Select value={currentRange} onValueChange={handleRangeChange}>
          <SelectTrigger id="time-range" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{t("analytics.today")}</SelectItem>
            <SelectItem value="7d">{t("analytics.last7d")}</SelectItem>
            <SelectItem value="30d">{t("analytics.last30d")}</SelectItem>
            <SelectItem value="90d">{t("analytics.last90d")}</SelectItem>
            <SelectItem value="all">{t("analytics.all")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
