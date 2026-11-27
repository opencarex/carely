import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSkeleton } from "@/components/workspace/loading-skeleton";

export function StockEditorSkeleton() {
  return (
    <LoadingSkeleton label="Loading medicines…">
      <div className="space-y-5">
        <Card className="space-y-3 p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-5 w-48 max-w-full" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </Card>
        <Card className="space-y-4 p-4 sm:p-6">
          <Skeleton className="h-7 w-36" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2].map((field) => (
              <div key={field} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </LoadingSkeleton>
  );
}

export const stockBatchRowClassName =
  "bg-carely-surface flex flex-wrap justify-between gap-3 rounded-lg p-3 text-sm";

export function StockBatchesSkeleton() {
  return (
    <LoadingSkeleton label="Loading stock batches…">
      <div className="space-y-3">
        {[0, 1, 2].map((batch) => (
          <div key={batch} className={stockBatchRowClassName}>
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </LoadingSkeleton>
  );
}
