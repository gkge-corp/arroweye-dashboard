"use client";

import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
import {
  filterTrendByRange,
  scaleTrendToPeak,
  smoothTrend,
  SMOOTHING_DAYS,
  type ChannelTrendPoint,
  type TrendChannel,
  type TrendRange,
} from "./hooks/use-campaign-channel-trend";

// Light mode gives each channel its own hue so overlapping areas stay apart.
// Dark mode keeps the brand greens, spread across the ramp for contrast.
const chartConfig = {
  streaming: {
    label: "Streaming",
    theme: { light: "#4ecdc4", dark: "var(--chart-1)" },
  },
  social: {
    label: "Social media",
    theme: { light: "#ff5c7a", dark: "var(--chart-3)" },
  },
  radio: {
    label: "Radio",
    theme: { light: "#2563eb", dark: "var(--chart-5)" },
  },
} satisfies ChartConfig;

// Drawn back to front, so the busiest channel does not cover the others.
const SERIES: TrendChannel[] = ["streaming", "social", "radio"];

const RANGE_OPTIONS: { value: TrendRange; label: string }[] = [
  { value: "campaign", label: "All time" },
  { value: "30d", label: "Last 30 days" },
  { value: "7d", label: "Last 7 days" },
];

const formatDay = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });

// Areas are scaled per channel, so the tooltip shows the real count.
function TooltipRow({
  channel,
  value,
}: {
  channel: TrendChannel;
  value: number;
}) {
  return (
    <>
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
        style={{ backgroundColor: `var(--color-${channel})` }}
      />
      <div className="flex flex-1 items-center justify-between gap-5 leading-none">
        <span className="text-muted-foreground">
          {chartConfig[channel]?.label ?? channel}
        </span>
        <span className="font-mono font-medium text-foreground tabular-nums">
          {value.toLocaleString()}
        </span>
      </div>
    </>
  );
}

interface ChannelTrendCardProps {
  points: ChannelTrendPoint[];
  radioAvailable: boolean;
  loading?: boolean;
  hasError?: boolean;
}

export function ChannelTrendCard({
  points,
  radioAvailable,
  loading = false,
  hasError = false,
}: ChannelTrendCardProps) {
  const [timeRange, setTimeRange] = React.useState<TrendRange>("campaign");
  const series = React.useMemo(
    () => SERIES.filter((channel) => channel !== "radio" || radioAvailable),
    [radioAvailable],
  );
  const chartData = React.useMemo(
    () =>
      // Smoothed before trimming, so the first days of a range still average
      // over a full window.
      scaleTrendToPeak(
        filterTrendByRange(
          smoothTrend(points, SMOOTHING_DAYS[timeRange]),
          timeRange,
        ),
        series,
      ),
    [points, timeRange, series],
  );
  return (
    <Card className="flex flex-col !gap-5 rounded-[8px] border p-[20px] shadow-none font-SansFlex bg-transparent hover:bg-green-500/5 hover:border-green-500">
      <CardHeader className="!flex min-h-9 items-center justify-between space-y-0 p-0">
        <div className="flex items-center gap-[5px] text-[#7a8081]">
          <CardTitle className="!text-[12px] font-[400] tracking-[.1rem]">
            CAMPAIGN TREND
          </CardTitle>
          <ChartInfoTooltip
            content={`Streams, social video views and radio spins per day${
              SMOOTHING_DAYS[timeRange] > 1 ? " (7-day average)" : ""
            }. Each channel is scaled to its own peak so all three trends are comparable; hover a day for the real counts.`}
          />
        </div>
        <Select
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TrendRange)}
        >
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a time range"
          >
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {RANGE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
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
          <Skeleton className="h-[250px] w-full rounded-lg" />
        ) : hasError || chartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center px-6 text-center">
            <p className="text-sm text-muted-foreground">
              {hasError
                ? "Could not load this data right now."
                : "No activity for this period yet."}
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                {series.map((channel) => (
                  <linearGradient
                    key={channel}
                    id={`fill-${channel}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={`var(--color-${channel})`}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor={`var(--color-${channel})`}
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
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatDay(String(value))}
                    indicator="dot"
                    formatter={(_, name, item) => (
                      <TooltipRow
                        channel={name as TrendChannel}
                        value={Number(
                          item.payload?.[`${String(name)}Raw`] ?? 0,
                        )}
                      />
                    )}
                  />
                }
              />
              {series.map((channel) => (
                <Area
                  key={channel}
                  dataKey={channel}
                  type="monotone"
                  strokeWidth={2}
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4 }}
                  fill={`url(#fill-${channel})`}
                  stroke={`var(--color-${channel})`}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
