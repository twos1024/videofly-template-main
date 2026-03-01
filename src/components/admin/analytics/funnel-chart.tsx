"use client";

import {
  FunnelChart as RechartsFunnelChart,
  Funnel,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelData {
  registeredUsers: number;
  firstVideoUsers: number;
  successfulFirstVideoUsers: number;
}

interface FunnelChartProps {
  data: FunnelData;
}

const FUNNEL_DATA = [
  { name: "注册用户", value: 0, color: "#8b5cf6" },
  { name: "生成首个视频", value: 0, color: "#a78bfa" },
  { name: "首个视频成功", value: 0, color: "#c4b5fd" },
];

export function FunnelChart({ data }: FunnelChartProps) {
  const chartData = FUNNEL_DATA.map((item) => {
    switch (item.name) {
      case "注册用户":
        return { ...item, value: data.registeredUsers };
      case "生成首个视频":
        return { ...item, value: data.firstVideoUsers };
      case "首个视频成功":
        return { ...item, value: data.successfulFirstVideoUsers };
      default:
        return item;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户激活漏斗</CardTitle>
        <CardDescription>
          用户从注册到成功生成首个视频的转化过程
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsFunnelChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Funnel
              dataKey="value"
              nameKey="name"
              stroke="none"
              isAnimationActive
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
              <LabelList
                dataKey="value"
                position="center"
                content={({ x, y, width, value }) => {
                  const safeX = typeof x === "number" ? x : 0;
                  const safeY = typeof y === "number" ? y : 0;
                  const safeWidth = typeof width === "number" ? width : 0;
                  const centerX = safeX + safeWidth / 2;
                  const centerY = safeY;
                  return (
                    <text
                      x={centerX}
                      y={centerY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={14}
                      fontWeight={600}
                    >
                      {typeof value === "number" ? value : 0}
                    </text>
                  );
                }}
              />
            </Funnel>
            <Tooltip
              formatter={(
                value: number | string | undefined,
                name: string | undefined
              ) => {
                if (typeof value === "number") {
                  return [value.toLocaleString(), name ?? ""];
                }
                return [String(value ?? 0), name ?? ""];
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
          </RechartsFunnelChart>
        </ResponsiveContainer>

        {/* Conversion rates */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">注册 → 首视频</span>
            <span className="font-medium">
              {data.registeredUsers > 0
                ? ((data.firstVideoUsers / data.registeredUsers) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">首视频 → 成功</span>
            <span className="font-medium">
              {data.firstVideoUsers > 0
                ? ((data.successfulFirstVideoUsers / data.firstVideoUsers) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">整体转化率</span>
            <span className="font-medium">
              {data.registeredUsers > 0
                ? ((data.successfulFirstVideoUsers / data.registeredUsers) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
