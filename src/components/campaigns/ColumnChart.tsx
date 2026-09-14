import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { ChartData } from "chart.js";
import { formatNumber } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartFilterSelect } from "./chart-filter-select";
import { ChartInfoTooltip } from "./chart-info-tooltip";
import { EmptyInsightChartCard } from "./EmptyInsightChartCard";
import { InsightChartSkeleton } from "./InsightChartSkeleton";

const CHART_FONT_FAMILY = "Google Sans Flex, sans-serif";

type ChartFilterState = {
  weeks?: string;
  lifetime?: string;
};

interface InsightChartProps<TFilters extends ChartFilterState> {
  title: string;
  value: number | string;
  percentageChange?: string;
  selectOptions?: Array<{ value: string; label: string }[]>;
  selectOptionsBottom?: Array<{ value: string; label: string }[]>;
  chartData?: ChartData<"bar", number[], string>;
  info?: string;
  isLoading?: boolean;
  placeholder?: string;
  setFilters?: React.Dispatch<React.SetStateAction<TFilters>>;
}

interface ChartDataItem {
  segment: string;
  name: string;
  value: number;
  fill: string;
  stroke: string;
  color: string;
  darkColor: string;
}

const generateDynamicColor = (index: number) => {
  return `var(--chart-${(index % 5) + 1})`;
};

const getDatasetColor = (colors: unknown, index: number, fallback: string) => {
  if (Array.isArray(colors) && typeof colors[index] === "string") {
    return colors[index];
  }

  return typeof colors === "string" ? colors : fallback;
};

const getLightChartFillColor = (color: string) =>
  `color-mix(in srgb, ${color} 20%, transparent)`;

const ColumnChart = <TFilters extends ChartFilterState = ChartFilterState>({
  title,
  value,
  selectOptions,
  selectOptionsBottom,
  chartData,
  placeholder,
  info,
  isLoading = false,
  setFilters,
}: InsightChartProps<TFilters>) => {
  const [hiddenSegments, setHiddenSegments] = useState<Set<string>>(new Set());

  const toggleSegment = (segment: string) => {
    setHiddenSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segment)) {
        next.delete(segment);
      } else {
        next.add(segment);
      }
      return next;
    });
  };

  const formatDataForRecharts = (): ChartDataItem[] => {
    const dataset = chartData?.datasets[0];

    if (!chartData?.labels || !dataset?.data) return [];

    // Filter out entries with zero values
    return chartData.labels
      .map((label, index) => {
        const segment = `segment-${index}`;
        const darkColor = generateDynamicColor(index);

        return {
          segment,
          name: label,
          value: dataset.data[index],
          fill: `var(--color-${segment})`,
          stroke: `var(--color-${segment}-border)`,
          color: getDatasetColor(dataset.backgroundColor, index, darkColor),
          darkColor,
        };
      })
      .filter((item) => item.value > 0); // Only include items with values greater than 0
  };

  const data = formatDataForRecharts();
  const visibleData = useMemo(
    () => data.filter((item) => !hiddenSegments.has(item.segment)),
    [data, hiddenSegments],
  );
  const chartConfig = data.reduce<ChartConfig>(
    (config, item) => ({
      ...config,
      [item.segment]: {
        theme: {
          light: getLightChartFillColor(item.color),
          dark: item.darkColor,
        },
      },
      [`${item.segment}-border`]: {
        theme: {
          light: item.color,
          dark: item.darkColor,
        },
      },
    }),
    { value: { label: title, color: "var(--chart-1)" } },
  );
  const hasChartData = data.length > 0;

  const weeksOptions = [
    { value: "", label: "Weeks" },
    { value: "1", label: "Week 1" },
    { value: "2", label: "Week 2" },
    { value: "3", label: "Week 3" },
    { value: "4", label: "Week 4" },
  ];

  const months = [
    { value: "", label: "Lifetime" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  if (isLoading) {
    return (
      <InsightChartSkeleton
        chartVariant="bar"
        showFilter={Boolean(selectOptions)}
      />
    );
  }

  if (!hasChartData) {
    return <EmptyInsightChartCard />;
  }

  const displayValue = Number(value) > 0 ? value : 0;

  return (
    <Card className="flex flex-col !gap-5 border-0 bg-transparent p-0 shadow-none font-SansFlex">
      <CardHeader className="!flex min-h-9 items-center justify-between space-y-0 p-0">
        <div className="flex items-center gap-[5px] text-[#7a8081]">
          <CardTitle className="!text-[12px] font-[400] tracking-[.1rem] uppercase">
            {title}
          </CardTitle>
          {info && <ChartInfoTooltip content={info} />}
        </div>
        {selectOptions && (
          <div className="flex flex-1 justify-end">
            {selectOptions.map((options, index) => (
              <div key={index} className="shrink-0">
                <ChartFilterSelect
                  options={options}
                  placeholder={placeholder}
                  className="w-[120px]"
                />
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2 p-0">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold lg:text-[56px] font-SansFlex leading-tight">
            {formatNumber(displayValue)}
          </p>
          {Number(value) > 1000 && (
            <ChartInfoTooltip content={value.toLocaleString()} />
          )}
        </div>

        <div>
          {data.length > 0 && (
            <div className="mb-3 flex min-h-[22px] flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] leading-none text-[#6f6f6f]">
              {data.map((item) => {
                const isHidden = hiddenSegments.has(item.segment);
                return (
                  <button
                    type="button"
                    key={item.segment}
                    onClick={() => toggleSegment(item.segment)}
                    className="flex items-center gap-2 transition-opacity"
                    style={{ opacity: isHidden ? 0.4 : 1 }}
                  >
                    <span
                      className="h-[14px] w-7 shrink-0 border border-[var(--chart-legend-border)] bg-[var(--chart-legend-bg)] dark:border-[var(--chart-legend-dark-border)] dark:bg-[var(--chart-legend-dark-bg)]"
                      style={
                        {
                          "--chart-legend-bg": getLightChartFillColor(
                            item.color,
                          ),
                          "--chart-legend-border": item.color,
                          "--chart-legend-dark-bg": item.darkColor,
                          "--chart-legend-dark-border": item.darkColor,
                        } as React.CSSProperties
                      }
                    />
                    <span
                      className={
                        isHidden ? "line-through decoration-[#6f6f6f]/60" : ""
                      }
                    >
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <ChartContainer
            config={chartConfig}
            className="h-[330px] w-full max-w-[350px] aspect-auto"
          >
            <BarChart
              data={visibleData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              barSize={32}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "var(--muted-foreground)",
                  fontFamily: CHART_FONT_FAMILY,
                }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "var(--muted-foreground)",
                  fontFamily: CHART_FONT_FAMILY,
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(hoveredValue, _dataKey, item) => (
                      <div className="flex min-w-28 items-center justify-between gap-5">
                        <span className="text-muted-foreground">
                          {item.payload?.name}
                        </span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {typeof hoveredValue === "number"
                            ? hoveredValue.toLocaleString()
                            : String(hoveredValue)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {visibleData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke={entry.stroke}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      {/* told to also hide this */}
      <CardFooter className="hidden items-center justify-between p-0">
        <div>
          {selectOptionsBottom?.map((options, index) => (
            <div key={index} className="max-w-[200px] w-full">
              <ChartFilterSelect
                options={weeksOptions}
                placeholder="Weeks"
                onChange={(value) => {
                  setFilters?.((prevFilters) => ({
                    ...prevFilters,
                    weeks: String(value),
                  }));
                }}
              />
            </div>
          ))}
        </div>
        <div>
          {selectOptionsBottom?.map((options, index) => (
            <div key={index} className="max-w-[110px] w-full">
              <ChartFilterSelect
                options={months}
                placeholder="Lifetime"
                onChange={(value) => {
                  setFilters?.((prevFilters) => ({
                    ...prevFilters,
                    lifetime: String(value),
                  }));
                }}
              />
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ColumnChart;
