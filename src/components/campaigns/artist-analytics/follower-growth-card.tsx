"use client";

import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartInfoTooltip } from "../chart-info-tooltip";
import { TrendSummary } from "../campaign-insights/channel-trend-card";
import { compactNumber, formatDay } from "./format";
import { PLATFORM_COLORS } from "./platform-brand";
import {
  toFollowerGrowth,
  type FollowerPoint,
  type FollowerRange,
} from "./hooks/use-artist-follower-history";

const RANGE_OPTIONS: { value: FollowerRange; label: string }[] = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

interface FollowerGrowthCardProps {
  platforms: { code: string; label: string }[];
  points: FollowerPoint[];
  range: FollowerRange;
  onRangeChange: (range: FollowerRange) => void;
  summary?: string | null;
  summaryLoading?: boolean;
  loading?: boolean;
  hasError?: boolean;
}

export function FollowerGrowthCard({
  platforms,
  points,
  range,
  onRangeChange,
  summary = null,
  summaryLoading = false,
  loading = false,
  hasError = false,
}: FollowerGrowthCardProps) {
  const chartConfig = React.useMemo(
    () =>
      Object.fromEntries(
        platforms.map((platform) => [
          platform.code,
          {
            label: platform.label,
            color: PLATFORM_COLORS[platform.code] ?? "var(--chart-1)",
          },
        ]),
      ) satisfies ChartConfig,
    [platforms],
  );
  const chartData = React.useMemo(
    () => toFollowerGrowth(points, platforms),
    [points, platforms],
  );

  return (
    <Card className="flex flex-col !gap-5 rounded-[8px] border p-[20px] shadow-none font-SansFlex bg-transparent hover:bg-green-500/5 hover:border-green-500">
      <CardHeader className="!flex min-h-9 items-center justify-between space-y-0 p-0">
        <div className="flex items-center gap-[5px] text-[#7a8081]">
          <CardTitle className="!text-[12px] font-[400] tracking-[.1rem]">
            FOLLOWER GROWTH
          </CardTitle>
          <ChartInfoTooltip content="Followers gained on each platform since the start of the selected period. Hover a day to see the total follower count; the cards above show the change for the period." />
        </div>
        <Select
          value={String(range)}
          onValueChange={(value) =>
            onRangeChange(Number(value) as FollowerRange)
          }
        >
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a time range"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {RANGE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={String(option.value)}
                className="rounded-lg"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : hasError || chartData.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center px-6 text-center">
            <p className="text-sm text-muted-foreground">
              {hasError
                ? "Could not load this data right now."
                : "No follower data for this period yet."}
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                {platforms.map((platform) => (
                  <linearGradient
                    key={platform.code}
                    id={`fill-follower-${platform.code}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={`var(--color-${platform.code})`}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor={`var(--color-${platform.code})`}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatDay}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(value) => compactNumber.format(Number(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatDay(String(value))}
                    indicator="dot"
                    formatter={(_, name, item) => (
                      <div className="flex flex-1 items-center justify-between gap-5 leading-none">
                        <span className="text-muted-foreground">
                          {chartConfig[String(name)]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {Number(
                            item.payload?.[`${String(name)}Raw`] ?? 0,
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              {platforms.map((platform) => (
                <Area
                  key={platform.code}
                  dataKey={platform.code}
                  type="monotone"
                  strokeWidth={2}
                  fillOpacity={1}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 4 }}
                  fill={`url(#fill-follower-${platform.code})`}
                  stroke={`var(--color-${platform.code})`}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
        {!loading && !hasError && chartData.length > 0 && (
          <TrendSummary summary={summary} loading={summaryLoading} />
        )}
      </CardContent>
    </Card>
  );
}
