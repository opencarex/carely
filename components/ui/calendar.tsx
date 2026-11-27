"use client";

import type { ComponentProps } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Day, DayPicker, type ChevronProps } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function CalendarDay({ day, modifiers, ...props }: ComponentProps<typeof Day>) {
  return (
    <Day
      {...props}
      day={day}
      modifiers={modifiers}
      aria-disabled={modifiers.disabled || undefined}
      aria-selected={
        modifiers.disabled || modifiers.hidden ? undefined : !!modifiers.selected
      }
    />
  );
}

function CalendarChevron({ className, orientation }: ChevronProps) {
  const Icon = {
    left: ChevronLeft,
    right: ChevronRight,
    up: ChevronUp,
    down: ChevronDown,
  }[orientation ?? "down"];
  return <Icon aria-hidden="true" className={cn("size-4", className)} />;
}

function Calendar({
  className,
  classNames,
  components,
  navLayout = "around",
  ...props
}: ComponentProps<typeof DayPicker>) {
  const navButton = cn(
    buttonVariants({ variant: "ghost", size: "icon" }),
    "aria-disabled:opacity-40"
  );

  return (
    <DayPicker
      className={cn("w-full", className)}
      navLayout={navLayout}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "relative min-w-0 flex-1",
        nav: "absolute inset-x-0 top-0 z-10 flex justify-between",
        button_previous: cn(navButton, navLayout === "around" && "absolute top-0 left-0"),
        button_next: cn(navButton, navLayout === "around" && "absolute top-0 right-0"),
        month_caption:
          "flex min-h-11 items-center justify-center px-11 text-center text-sm font-semibold",
        month_grid: "w-full table-fixed border-collapse",
        weekday: "text-muted-foreground py-2 text-center text-xs font-medium",
        week_number: "text-muted-foreground text-center text-xs",
        day: "group p-0.5 text-center align-middle",
        day_button: cn(
          "h-11 w-full rounded-md text-sm leading-4 whitespace-pre-line outline-none transition-colors enabled:hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:h-12",
          "group-data-disabled:text-muted-foreground group-data-disabled:enabled:hover:bg-transparent",
          "group-data-selected:bg-carely-primary-deep group-data-selected:text-primary-foreground group-data-selected:enabled:hover:bg-carely-primary-deep"
        ),
        ...classNames,
      }}
      components={{ Day: CalendarDay, Chevron: CalendarChevron, ...components }}
      {...props}
    />
  );
}

export { Calendar };
