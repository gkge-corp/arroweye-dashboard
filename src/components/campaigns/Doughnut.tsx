"use client";

import React, { useMemo, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

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
import { formatNumber } from "@/lib/utils";
import { ChartFilterSelect } from "./chart-filter-select";
import { ChartInfoTooltip } from "./chart-info-tooltip";
import { InsightChartSkeleton } from "./InsightChartSkeleton";

type ChartFilterState = {
  country?: string;
  weeks?: string;
  lifetime?: string;
};

type DoughnutChartData = {
  labels?: string[];
  datasets: Array<{
    data?: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
};

interface InsightChartProps<TFilters extends ChartFilterState> {
  title: string;
  value: number | string;
  percentageChange?: string;
  selectOptions?: Array<{ value: string; label: string }[]>;
  selectOptionsBottom?: Array<{ value: string; label: string }[]>;
  chartData?: DoughnutChartData;
  info?: string;
  isLoading?: boolean;
  placeholder?: string;
  /** Shown instead of the grey placeholder ring when a source is switched off. */
  emptyMessage?: string;
  /** Optional control rendered under emptyMessage, e.g. "Choose countries". */
  emptyAction?: React.ReactNode;
  setFilters?: React.Dispatch<React.SetStateAction<TFilters>>;
}

const fallbackColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const filterSelectClassName = "w-[120px]";
const emptyChartColor = "#d4d4d8";
const emptyChartFillColor = "color-mix(in srgb, #d4d4d8 28%, transparent)";

const getDarkChartColor = (index: number) =>
  `var(--chart-${(index % fallbackColors.length) + 1})`;

const getLightChartFillColor = (color: string) =>
  `color-mix(in srgb, ${color} 20%, transparent)`;

const getChartColor = (
  backgroundColor: string | string[] | undefined,
  index: number,
) => {
  if (Array.isArray(backgroundColor)) {
    return (
      backgroundColor[index] ?? fallbackColors[index % fallbackColors.length]
    );
  }

  return backgroundColor ?? fallbackColors[index % fallbackColors.length];
};

const getChartKey = (label: string, index: number) => {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "segment"}-${index}`;
};

const DoughnutChart = <TFilters extends ChartFilterState = ChartFilterState>({
  title,
  value,
  selectOptions,
  selectOptionsBottom,
  chartData,
  placeholder,
  info,
  isLoading = false,
  emptyMessage,
  emptyAction,
  setFilters,
}: InsightChartProps<TFilters>) => {
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

  const labels = chartData?.labels ?? [];
  const dataset = chartData?.datasets[0];
  const values = dataset?.data ?? [];

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

  const pieChartData = values
    .map((entryValue, index) => {
      const label = labels[index] ?? `Segment ${index + 1}`;
      const key = getChartKey(label, index);

      return {
        segment: key,
        label,
        value: entryValue,
        color: getChartColor(dataset?.backgroundColor, index),
        darkColor: getDarkChartColor(index),
        fill: `var(--color-${key})`,
        stroke: `var(--color-${key}-border)`,
      };
    })
    .filter((item) => Number(item.value) > 0);
  const hasChartData = pieChartData.length > 0;
  const emptyPieChartData = (labels.length > 0 ? labels : ["No data"]).map(
    (label, index) => {
      const key = getChartKey(label, index);

      return {
        segment: key,
        label,
        value: 1,
        color: emptyChartColor,
        darkColor: "var(--muted)",
        fill: `var(--color-${key})`,
        stroke: `var(--color-${key}-border)`,
      };
    },
  );
  const displayPieChartData = hasChartData ? pieChartData : emptyPieChartData;
  const displayValue = Number(value) > 0 ? value : 0;

  const visiblePieChartData = useMemo(
    () =>
      hasChartData
        ? pieChartData.filter((item) => !hiddenSegments.has(item.segment))
        : displayPieChartData,
    [displayPieChartData, hasChartData, pieChartData, hiddenSegments],
  );

  const chartConfig = displayPieChartData.reduce<ChartConfig>(
    (config, item) => ({
      ...config,
      [item.segment]: {
        label: item.label,
        theme: {
          light: hasChartData
            ? getLightChartFillColor(item.color)
            : emptyChartFillColor,
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
    {
      value: {
        label: title,
      },
    },
  );

  if (isLoading) {
    return <InsightChartSkeleton showFilter={Boolean(selectOptions)} />;
  }

  return (
    <Card className="flex flex-col !gap-5 border-0 bg-transparent p-0 shadow-none font-SansFlex">
      <CardHeader className="!flex min-h-9 items-center justify-between space-y-0 p-0">
        <div className="flex items-center gap-[5px] text-[#7a8081]">
          <CardTitle className="!text-[12px] font-[400] tracking-[.1rem]">
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
                  className={filterSelectClassName}
                  onChange={(selectedValue) => {
                    setFilters?.((prevFilters) => ({
                      ...prevFilters,
                      country: String(selectedValue),
                    }));
                  }}
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
          {!hasChartData && emptyMessage ? (
            <div className="mx-auto flex aspect-square w-full max-w-[350px] flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="font-SansFlex text-[13px] leading-relaxed text-[#6f6f6f]">
                {emptyMessage}
              </p>
              {emptyAction}
            </div>
          ) : (
            displayPieChartData.length > 0 && (
              <div>
                <div className="mb-3 flex min-h-[22px] flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] leading-none text-[#6f6f6f]">
                  {displayPieChartData.map((item) => {
                    const isHidden =
                      hasChartData && hiddenSegments.has(item.segment);
                    return (
                      <button
                        type="button"
                        key={item.segment}
                        disabled={!hasChartData}
                        onClick={() => {
                          if (hasChartData) toggleSegment(item.segment);
                        }}
                        className="flex items-center gap-2 transition-opacity"
                        style={{
                          opacity: isHidden || !hasChartData ? 0.55 : 1,
                        }}
                      >
                        <span
                          className="h-[14px] w-7 shrink-0 border bg-[var(--chart-legend-bg)] dark:bg-[var(--chart-legend-dark-bg)] border-[var(--chart-legend-border)] dark:border-[var(--chart-legend-dark-border)]"
                          style={
                            {
                              "--chart-legend-bg": hasChartData
                                ? getLightChartFillColor(item.color)
                                : emptyChartFillColor,
                              "--chart-legend-border": item.color,
                              "--chart-legend-dark-bg": item.darkColor,
                              "--chart-legend-dark-border": item.darkColor,
                            } as React.CSSProperties
                          }
                        />
                        <span
                          className={
                            isHidden
                              ? "line-through decoration-[#6f6f6f]/60"
                              : ""
                          }
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {visiblePieChartData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square w-full max-w-[350px] font-SansFlex"
                  >
                    <PieChart>
                      {hasChartData && (
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent hideLabel nameKey="segment" />
                          }
                        />
                      )}
                      <Pie
                        data={visiblePieChartData}
                        dataKey="value"
                        nameKey="segment"
                        innerRadius="43%"
                        outerRadius="88%"
                      >
                        {visiblePieChartData.map((item) => (
                          <Cell
                            key={item.segment}
                            fill={item.fill}
                            stroke={item.stroke}
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="mx-auto flex aspect-square w-full max-w-[350px] items-center justify-center text-[13px] text-[#6f6f6f]">
                    All segments hidden
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </CardContent>

      <CardFooter className="hidden items-center justify-between p-0">
        <div>
          {selectOptionsBottom?.map((options, index) => (
            <div key={index} className="min-w-[80px] max-w-[200px] w-full">
              <ChartFilterSelect
                options={weeksOptions}
                placeholder="Weeks"
                onChange={(selectedValue) => {
                  setFilters?.((prevFilters) => ({
                    ...prevFilters,
                    weeks: String(selectedValue),
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
                onChange={(selectedValue) => {
                  setFilters?.((prevFilters) => ({
                    ...prevFilters,
                    lifetime: String(selectedValue),
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

export default DoughnutChart;
