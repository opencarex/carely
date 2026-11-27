"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { FactCard } from "@/components/patient/patient-shared";
import { LoadingRows } from "@/components/workspace/loading-skeleton";
import { formatPatientDate } from "@/lib/patient-appointments";
import type { PatientAppointmentView } from "@/lib/schemas/booking";
import type { PatientQueueStatusResponse } from "@/lib/schemas/queue";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";

export function QueueStatus({ appointment }: { appointment?: PatientAppointmentView }) {
  const { data, error, loading, refresh } =
    useVisiblePolling<PatientQueueStatusResponse>("/api/patient/queue");
  // The queued visit can differ from the next appointment initially rendered by the server.
  const visit = data?.entry ?? appointment;
  return (
    <div className="space-y-5">
      <h2 className="font-semibold">
        {data?.entry
          ? "Your checked-in visit"
          : appointment
            ? "Your next visit"
            : loading || error
              ? "Queue status"
              : "No upcoming appointments"}
      </h2>
      {visit && (
        <>
          <p className="font-semibold">{visit.doctorName}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FactCard label="Date" value={formatPatientDate(visit.date)} />
            <FactCard label="Appointment number" value={`#${visit.appointmentNo}`} />
          </div>
        </>
      )}
      {data?.entry ? (
        <div className="bg-carely-surface rounded-xl p-4 text-sm">
          <p className="font-semibold">
            Queue status: {data.entry.status.replaceAll("_", " ")}
          </p>
          <p className="mt-1">
            {data.entry.status === "completed"
              ? "This visit is complete."
              : `Your current position: ${data.entry.position}`}
          </p>
        </div>
      ) : loading ? (
        <LoadingRows
          label="Checking your queue status…"
          count={1}
          rowClassName="bg-carely-surface border-0"
        />
      ) : !error ? (
        <p className="text-muted-foreground text-sm">
          Check in at reception when you arrive.
        </p>
      ) : null}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="button" variant="outline" onClick={() => void refresh()}>
        Refresh now
      </Button>
      <Link
        href={visit ? "/patient/appointments" : "/patient/book"}
        className={buttonVariants({ variant: "outline" })}
      >
        {visit ? "View appointments" : "Find a doctor"}
      </Link>
    </div>
  );
}
