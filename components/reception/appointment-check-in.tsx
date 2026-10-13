"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/workspace/workspace-ui";
import { BookingDetails } from "@/components/reception/booking-details";
import { useReceptionDemo } from "@/components/reception/reception-demo-provider";
import { cn } from "@/lib/utils";

export function AppointmentCheckIn() {
  const { bookings, doctors, checkIn } = useReceptionDemo();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("booking") ?? bookings[0].id
  );
  const filtered = bookings.filter((item) =>
    `${item.id} ${item.patientId} ${item.patientName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const booking = filtered.find((item) => item.id === selectedId);
  function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    setSearch(term);
    const first = bookings.find((item) =>
      `${item.id} ${item.patientId} ${item.patientName}`
        .toLowerCase()
        .includes(term.toLowerCase())
    );
    setSelectedId(first?.id ?? null);
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
            placeholder="Search appointment reference or patient ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            controlSize="compact"
          />
        </div>
        <Button type="submit">Find booking</Button>
      </form>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Panel title="Today's appointments" className="min-w-0">
          <div className="mb-4 lg:hidden">
            <label
              htmlFor="appointment-selection"
              className="mb-2 block text-xs font-semibold"
            >
              Select a booking
            </label>
            <Select
              value={selectedId}
              items={filtered.map((item) => ({
                value: item.id,
                label: item.id + " - " + item.patientName + " (" + item.status + ")",
              }))}
              onValueChange={(value) => {
                if (value) setSelectedId(value);
              }}
            >
              <SelectTrigger id="appointment-selection" className="min-w-0 gap-2">
                <SelectValue
                  className="min-w-0 truncate"
                  placeholder="Select a booking"
                />
              </SelectTrigger>
              <SelectContent className="max-h-80 max-w-[calc(100vw-2rem)] overflow-y-auto">
                {filtered.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.id} - {item.patientName} ({item.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden space-y-3 lg:block">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={selectedId === item.id}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "focus-visible:ring-ring/40 w-full rounded-xl p-4 text-left outline-none focus-visible:ring-2",
                  selectedId === item.id
                    ? "bg-secondary"
                    : "bg-carely-surface hover:bg-secondary/60"
                )}
              >
                <span className="block text-sm font-semibold">
                  {item.id} &middot; {item.status}
                </span>
                <span className="mt-2 block text-sm">
                  {item.patientName} &middot; {item.patientId}
                </span>
                <span className="text-muted-foreground mt-2 block text-xs">
                  {item.time} &middot;{" "}
                  {doctors.find((doctor) => doctor.id === item.doctorId)?.name}
                </span>
              </button>
            ))}
            {!filtered.length && (
              <p role="status" className="text-muted-foreground py-6 text-sm">
                No matching bookings.
              </p>
            )}
          </div>
          {!filtered.length && (
            <p role="status" className="text-muted-foreground py-4 text-sm lg:hidden">
              No matching bookings.
            </p>
          )}
        </Panel>
        <Panel
          title={booking ? `Selected booking - ${booking.id}` : "Booking details"}
          className="min-w-0 lg:col-span-2"
        >
          {booking ? (
            <BookingDetails
              key={booking.id}
              booking={booking}
              doctor={doctors.find((item) => item.id === booking.doctorId)!}
              onCheckIn={checkIn}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Select a booking to review arrival and check-in details.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
