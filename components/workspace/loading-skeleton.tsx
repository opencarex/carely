import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <p role="status" className="sr-only">
        {label}
      </p>
      <div aria-hidden="true">{children}</div>
    </>
  );
}

export function SkeletonRows({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={cn("space-y-2 rounded-xl border p-4", className)}>
          <Skeleton className="h-5 w-40 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      ))}
    </div>
  );
}

export function LoadingRows({
  label,
  count,
  rowClassName,
}: {
  label: string;
  count?: number;
  rowClassName?: string;
}) {
  return (
    <LoadingSkeleton label={label}>
      <SkeletonRows count={count} className={rowClassName} />
    </LoadingSkeleton>
  );
}

export function LoadingFields({
  label,
  count = 4,
  className,
}: {
  label: string;
  count?: number;
  className?: string;
}) {
  return (
    <LoadingSkeleton label={label}>
      <div className={cn("grid gap-4", className)}>
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </LoadingSkeleton>
  );
}

export function LoadingDashboard({ label }: { label: string }) {
  return (
    <LoadingSkeleton label={label}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((card) => (
            <Card key={card} className="space-y-3 p-5">
              <Skeleton className="h-4 w-28 max-w-full" />
              <Skeleton className="h-7 w-16" />
            </Card>
          ))}
        </div>
        <SkeletonRows count={2} />
      </div>
    </LoadingSkeleton>
  );
}
