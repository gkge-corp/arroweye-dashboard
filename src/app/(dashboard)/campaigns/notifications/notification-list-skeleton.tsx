import { Skeleton } from "@/components/ui/skeleton";

interface NotificationListSkeletonProps {
  rows?: number;
}

export function NotificationListSkeleton({
  rows = 5,
}: NotificationListSkeletonProps) {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 border-b border-neutral-100 px-5 py-3.5 dark:border-zinc-800"
        >
          <Skeleton className="mt-0.5 size-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-2 w-12" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
