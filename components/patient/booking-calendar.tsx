"use client";

import { labelDayButton, TZDate } from "react-day-picker";
import { enGB } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import type { OpenDatesResponse } from "@/lib/schemas/booking";

// Use UTC for date-only labels. The server sets the booking window in Colombo time.
function calendarDate(value: string) {
  return new TZDate(`${value}T00:00:00Z`, "UTC");
}

function dateKey(day: Date) {
  return day.toISOString().slice(0, 10);
}

export function capacityLabel(count: number) {
  return `${count} ${count === 1 ? "place" : "places"} left`;
}

export function BookingCalendar({
  availability,
  selectedDate,
  onSelect,
}: {
  availability: OpenDatesResponse;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const { bookingWindow, dates, unavailableDates } = availability;
  const { startDate, endDate } = bookingWindow;
  const start = calendarDate(startDate);
  const end = calendarDate(endDate);
  const available = new Map(dates.map((entry) => [entry.date, entry.availableCount]));
  const unavailable = new Map(
    unavailableDates.map((entry) => [entry.date, entry.status])
  );

  return (
    <div className="bg-card w-full max-w-md space-y-2 rounded-xl border p-2 sm:p-3">
      <Calendar
        mode="single"
        required
        locale={enGB}
        timeZone="UTC"
        today={start}
        defaultMonth={selectedDate ? calendarDate(selectedDate) : start}
        startMonth={start}
        endMonth={end}
        hideNavigation={start.getMonth() === end.getMonth()}
        selected={selectedDate ? calendarDate(selectedDate) : undefined}
        disabled={(day) => !available.has(dateKey(day))}
        onSelect={(day) => onSelect(dateKey(day))}
        modifiers={{
          available: (day) =>
            available.has(dateKey(day)) && dateKey(day) !== selectedDate,
          full: (day) => unavailable.get(dateKey(day)) === "full",
          outsideWindow: (day) => dateKey(day) < startDate || dateKey(day) > endDate,
        }}
        modifiersClassNames={{
          available:
            "[&>button]:bg-carely-primary-soft [&>button]:text-carely-primary-deep [&>button:hover]:bg-secondary",
          full: "[&>button[aria-label]]:bg-destructive/10 [&>button[aria-label]]:text-destructive",
          outsideWindow: "opacity-60",
        }}
        formatters={{
          formatDay: (day) => {
            const key = dateKey(day);
            const capacity = available.get(key);
            if (capacity !== undefined)
              return `${day.getDate()}\n${capacity > 99 ? "99+" : capacity}`;
            if (unavailable.get(key) === "full") return `${day.getDate()}\nFull`;
            return String(day.getDate());
          },
        }}
        labels={{
          labelDayButton: (day, modifiers, options, dateLib) => {
            const key = dateKey(day);
            const capacity = available.get(key);
            let status = "No clinic";
            if (capacity !== undefined) status = capacityLabel(capacity);
            else if (unavailable.get(key) === "full") status = "Fully booked";
            else if (unavailable.get(key) === "ended") status = "Clinic session ended";
            else if (key < startDate) status = "Past date";
            else if (key > endDate) status = "Outside the booking window";
            return `${labelDayButton(day, modifiers, options, dateLib)}, ${status}`;
          },
        }}
      />
      <ul className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="bg-carely-primary-soft size-3 rounded-sm" />
          Available (places left)
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="bg-destructive/10 size-3 rounded-sm" />
          Fully booked
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="border-input size-3 rounded-sm border" />
          No clinic
        </li>
      </ul>
    </div>
  );
}
