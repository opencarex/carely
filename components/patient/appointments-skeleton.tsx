import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSkeleton } from "@/components/workspace/loading-skeleton";

export function AppointmentsSkeleton() {
  return (
    <LoadingSkeleton label="Loading appointments…">
      <div className="mb-5 flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-16" />
      </div>
      <Card className="space-y-4 p-5 sm:p-6">
        <Skeleton className="h-6 w-44 max-w-full" />
        {[0, 1].map((row) => (
          <div key={row} className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-48 max-w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-56 max-w-full" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </div>
        ))}
      </Card>
    </LoadingSkeleton>
  );
}
