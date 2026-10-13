import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "amber";
}) {
  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-0 px-2.5 py-1 text-xs font-medium shadow-none",
        tone === "green" && "bg-carely-success-soft text-carely-success",
        tone === "blue" && "bg-carely-surface text-primary border-primary/20 border",
        tone === "amber" && "border border-amber-200 bg-amber-100 text-amber-900"
      )}
    >
      <span
        className={cn(
          "inline-block size-1.5 rounded-full",
          tone === "green" && "bg-carely-success",
          tone === "blue" && "bg-primary",
          tone === "amber" && "bg-amber-600"
        )}
      />
      {children}
    </Badge>
  );
}

export function InitialAvatar({
  children,
  large = false,
}: {
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <span
      className={cn(
        "bg-secondary text-primary grid shrink-0 place-items-center font-bold",
        large
          ? "size-12 rounded-full text-base sm:size-14 sm:text-lg"
          : "size-8 rounded-lg text-xs"
      )}
    >
      {children}
    </span>
  );
}

export function FactCard({
  label,
  value,
  surface = false,
}: {
  label: string;
  value: string;
  surface?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3.5",
        surface ? "bg-carely-surface min-h-28" : "bg-card"
      )}
    >
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {label}
      </p>
      <p className="text-foreground mt-1.5 text-xs font-semibold sm:text-sm">{value}</p>
    </div>
  );
}

export function StepGuide({
  number,
  title,
  copy,
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-3">
      <InitialAvatar>{number}</InitialAvatar>
      <div>
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{copy}</p>
      </div>
    </div>
  );
}
