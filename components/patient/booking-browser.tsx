"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { DoctorFinder } from "@/components/patient/doctor-finder";
import { AppointmentBooking } from "@/components/patient/appointment-booking";
import { LoadingRows } from "@/components/workspace/loading-skeleton";
import type { PatientDoctorOption, PatientVisitReason } from "@/lib/schemas/booking";

export function BookingBrowser({ reasons }: { reasons: PatientVisitReason[] }) {
  const [doctor, setDoctor] = useState<PatientDoctorOption | null>(null);
  const [reasonId, setReasonId] = useState("");
  const [response, setResult] = useState<{
    reasonId: string;
    doctors: PatientDoctorOption[];
    message?: string;
    error?: string;
  } | null>(null);
  const result = response?.reasonId === reasonId ? response : null;
  const booking = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!reasonId) return;
    const controller = new AbortController();
    async function loadDoctors() {
      try {
        const response = await fetch(
          `/api/patient/doctor-finder?reasonId=${encodeURIComponent(reasonId)}`,
          { cache: "no-store", signal: controller.signal }
        );
        const data: {
          doctors?: PatientDoctorOption[];
          message?: string;
          error?: string;
        } = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to find doctors.");
        if (!controller.signal.aborted)
          setResult({ reasonId, doctors: data.doctors ?? [], message: data.message });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            reasonId,
            doctors: [],
            error: error instanceof Error ? error.message : "Unable to find doctors.",
          });
      }
    }
    void loadDoctors();
    return () => controller.abort();
  }, [reasonId]);

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <Card className="min-w-0 p-5 sm:p-6">
        <label className="mb-5 block text-sm font-semibold" htmlFor="visit-reason">
          Reason for visit
          <select
            id="visit-reason"
            className="border-input bg-background mt-2 flex h-11 w-full rounded-md border px-3 text-sm"
            value={reasonId}
            onChange={(event) => {
              const nextReasonId = event.target.value;
              setReasonId(nextReasonId);
              setDoctor(null);
              setResult(null);
            }}
          >
            <option value="">Choose a reason</option>
            {reasons.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.name} — {reason.specialtyName}
              </option>
            ))}
          </select>
        </label>
        {reasonId && !result && <LoadingRows label="Finding doctors…" />}
        {result?.error && (
          <p role="alert" className="text-destructive text-sm">
            {result.error}
          </p>
        )}
        {result && !result.error && result.message && (
          <p role="status" className="text-muted-foreground mb-4 text-sm">
            {result.message}
          </p>
        )}
        {result && !result.error && (result.doctors.length > 0 || !result.message) && (
          <DoctorFinder
            doctors={result.doctors}
            selectedId={doctor?.id}
            onSelect={(selected) => {
              setDoctor(selected);
              requestAnimationFrame(() =>
                booking.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              );
            }}
          />
        )}
      </Card>
      <Card ref={booking} className="min-w-0 scroll-mt-5 p-5 sm:p-6">
        {doctor && reasonId ? (
          <AppointmentBooking
            key={`${doctor.id}-${reasonId}`}
            doctor={doctor}
            visitReasonId={reasonId}
          />
        ) : (
          <>
            <h2 className="font-semibold">Book appointment</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Choose a doctor to see available clinic dates.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
