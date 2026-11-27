"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookingCalendar, capacityLabel } from "@/components/patient/booking-calendar";
import { FactCard } from "@/components/patient/patient-shared";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSkeleton } from "@/components/workspace/loading-skeleton";
import { formatPatientDate, formatSession } from "@/lib/patient-appointments";
import type {
  BookAppointmentResult,
  OpenDatesResponse,
  PatientDoctorOption,
} from "@/lib/schemas/booking";

export function AppointmentBooking({
  doctor,
  visitReasonId,
}: {
  doctor: PatientDoctorOption;
  visitReasonId: string;
}) {
  const router = useRouter();
  const [availability, setAvailability] = useState<OpenDatesResponse | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);
  const chosen = availability?.dates.find((entry) => entry.date === date);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(
          `/api/appointments/open-dates?doctorId=${encodeURIComponent(doctor.id)}`,
          { cache: "no-store", signal: controller.signal }
        );
        const data: OpenDatesResponse & { error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load dates.");
        setAvailability(data);
        setDate((selected) =>
          data.dates.some((entry) => entry.date === selected) ? selected : ""
        );
        setLoadError("");
      } catch (cause) {
        if (!controller.signal.aborted)
          setLoadError(cause instanceof Error ? cause.message : "Unable to load dates.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [doctor.id, revision]);

  function refreshDates() {
    setLoading(true);
    setLoadError("");
    setRevision((value) => value + 1);
  }

  async function confirm() {
    if (!chosen || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctor.id, date: chosen.date, visitReasonId }),
      });
      const result: BookAppointmentResult = await response.json();
      if (!response.ok || !result.success || !result.appointment) {
        setError(result.error ?? "Unable to book. Please try again.");
        refreshDates();
        return;
      }
      setOpen(false);
      router.push(
        `/patient/appointments/confirmed?id=${encodeURIComponent(result.appointment.id)}`
      );
      router.refresh();
    } catch {
      setError(
        "The booking result could not be confirmed. Check My Appointments before trying again."
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold">Book appointment</h2>
        <p className="mt-2 font-medium">{doctor.name}</p>
        <p className="text-muted-foreground text-sm">
          {doctor.specialtyName ?? "General clinic"}
        </p>
      </div>
      {loading && !availability && (
        <LoadingSkeleton label="Loading available dates…">
          <div className="bg-card w-full max-w-md space-y-3 rounded-xl border p-3">
            <Skeleton className="mx-auto h-5 w-28" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }, (_, day) => (
                <Skeleton key={day} className="aspect-square w-full" />
              ))}
            </div>
          </div>
        </LoadingSkeleton>
      )}
      {loadError && (
        <p role="alert" className="text-destructive text-sm">
          {loadError}
        </p>
      )}
      {availability && (
        <fieldset disabled={loading || !!loadError} className="min-w-0 space-y-3">
          <legend className="mb-2 text-sm font-semibold">Choose a clinic date</legend>
          <p className="text-muted-foreground text-sm">
            Booking is open for the next 14 days, including today.
          </p>
          <BookingCalendar
            availability={availability}
            selectedDate={date}
            onSelect={(selectedDate) => {
              setDate(selectedDate);
              setError("");
            }}
          />
          <div role="status" aria-atomic="true">
            {chosen && (
              <div className="bg-carely-surface max-w-md rounded-lg border p-3 text-sm">
                <p className="font-semibold">{formatPatientDate(chosen.date)}</p>
                <p className="text-muted-foreground mt-1">
                  {formatSession(chosen.startTime, chosen.endTime)} ·{" "}
                  {capacityLabel(chosen.availableCount)}
                </p>
              </div>
            )}
          </div>
          {!availability.dates.length && (
            <p className="text-muted-foreground text-sm">
              No sessions are open in the next 14 days. Try another doctor or contact
              reception.
            </p>
          )}
        </fieldset>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={refreshDates}
        disabled={loading || pending}
      >
        {loading && availability ? "Refreshing dates…" : "Refresh dates"}
      </Button>
      <p className="text-muted-foreground text-sm">
        Appointments are ordered by number within the clinic session. A number does not
        reserve an exact consultation time.
      </p>
      {doctor.consultationFee && (
        <FactCard label="Consultation fee (LKR)" value={doctor.consultationFee} />
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button
        className="w-full"
        disabled={!chosen || loading || !!loadError || pending}
        onClick={() => setOpen(true)}
      >
        Review appointment
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm appointment</DialogTitle>
            <DialogDescription>
              Review the clinic date. Your appointment number is assigned when the booking
              is saved.
            </DialogDescription>
          </DialogHeader>
          <FactCard label="Doctor" value={doctor.name} />
          {chosen && (
            <>
              <FactCard label="Date" value={formatPatientDate(chosen.date)} />
              <FactCard
                label="Clinic session"
                value={`${formatSession(chosen.startTime, chosen.endTime)} · ${capacityLabel(chosen.availableCount)}`}
              />
            </>
          )}
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Go back
            </Button>
            <Button
              disabled={pending || loading || !chosen || !!loadError}
              onClick={confirm}
            >
              {pending ? "Booking..." : "Book appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
