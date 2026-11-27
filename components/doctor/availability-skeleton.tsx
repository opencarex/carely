import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSkeleton } from "@/components/workspace/loading-skeleton";

export function AvailabilitySkeleton() {
  return (
    <LoadingSkeleton label="Loading your weekly schedule…">
      <Card className="space-y-4 p-4 sm:p-6">
        <div className="mb-5 space-y-2">
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        {[0, 1, 2].map((day) => (
          <div key={day} className="space-y-4 rounded-lg border p-4">
            <Skeleton className="h-5 w-28" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((field) => (
                <div key={field} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </LoadingSkeleton>
  );
}
