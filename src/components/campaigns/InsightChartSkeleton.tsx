import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface InsightChartSkeletonProps {
  chartVariant?: "pie" | "bar";
  showFilter?: boolean;
}

export function InsightChartSkeleton({
  chartVariant = "pie",
  showFilter = false,
}: InsightChartSkeletonProps) {
  return (
    <div className="w-full space-y-5 font-SansFlex">
      <div className="flex min-h-9 items-center justify-between">
        <Skeleton className="h-3 w-20" />
        {showFilter && <Skeleton className="h-9 w-[120px]" />}
      </div>

      <Skeleton className="h-9 w-24 lg:h-14 lg:w-36" />
      <Skeleton className="h-3 w-28" />

      <div className="pt-2">
        <div className="mb-3 flex min-h-[22px] flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="h-[14px] w-7 rounded-none" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>

        <Skeleton
          className={cn(
            "mx-auto w-full max-w-[350px] rounded-[8px]",
            chartVariant === "bar" ? "h-[330px]" : "aspect-square",
          )}
        />
      </div>
    </div>
  );
}
