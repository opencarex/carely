"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { BookingDetails, bookingStatus } from "@/components/reception/booking-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/workspace/workspace-ui";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import type { ReceptionAppointmentSearchResponse } from "@/lib/schemas/reception";
import { cn } from "@/lib/utils";

export function AppointmentCheckIn() {
  const bookingReference = useSearchParams().get("booking")?.slice(0, 120) ?? "";
  const [query, setQuery] = useState(bookingReference);
  const [search, setSearch] = useState(bookingReference);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const params = new URLSearchParams({ q: search, page: String(page) });
  const { data, error, loading, refresh } =
    useVisiblePolling<ReceptionAppointmentSearchResponse>(
      `/api/reception/appointments?${params}`
    );
  const appointments = data?.appointments ?? [];
  const selected = appointments.find((item) => item.id === selectedId) ?? appointments[0];

  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim() === search && page === 1) void refresh();
    setSearch(query.trim());
    setPage(1);
    setSelectedId(null);
  }

  return (
    <>
      <form
        onSubmit={find}
        className="bg-card mb-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <Input
            id="booking-search"
            label="Find booking"
            showLabel
            placeholder="Booking reference, appointment number, or patient"
            value={query}
            maxLength={120}
            onChange={(event) => setQuery(event.target.value)}
            controlSize="compact"
          />
        </div>
        <Button type="submit">Find booking</Button>
      </form>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Today's appointments" className="min-w-0">
          {loading && (
            <p role="status" className="text-muted-foreground text-sm">
              Loading appointments...
            </p>
          )}
          {error && (
            <div className="space-y-2">
              <p role="alert" className="text-destructive text-sm">
                Unable to load appointments for today.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refresh()}
              >
                Retry
              </Button>
            </div>
          )}
          {!error && !loading && appointments.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No appointments match this search.
            </p>
          )}
          <div className="space-y-2">
            {appointments.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected?.id === item.id}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "focus-visible:ring-ring/40 w-full rounded-xl p-3 text-left outline-none focus-visible:ring-2",
                  selected?.id === item.id
                    ? "bg-secondary"
                    : "bg-carely-surface hover:bg-secondary/60"
                )}
              >
                <span className="block text-sm font-semibold">
                  #{item.appointmentNo} · {item.patientName}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs">
                  {item.doctorName} · {bookingStatus(item)}
                </span>
              </button>
            ))}
          </div>
          {(page > 1 || data?.hasMore) && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-xs">Page {page}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!data?.hasMore}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </Panel>
        <Panel title="Booking details" className="min-w-0 lg:col-span-2">
          {selected ? (
            <BookingDetails key={selected.id} booking={selected} onCheckedIn={refresh} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Select a booking to review check-in details.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
