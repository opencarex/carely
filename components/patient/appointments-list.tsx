"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { EmptyAppointments } from "@/components/patient/empty-appointments";
import type { PatientAppointmentView } from "@/lib/schemas/booking";

export function AppointmentsList({
  appointments,
  hospitalPhone,
}: {
  appointments: PatientAppointmentView[];
  hospitalPhone: string | null;
}) {
  const [history, setHistory] = useState(false);
  const upcoming = appointments.filter((item) => item.isUpcoming);
  const visible = history
    ? appointments.filter((item) => !item.isUpcoming).toReversed()
    : upcoming;
  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2" aria-label="Appointment filters">
        <Button
          variant={!history ? "default" : "outline"}
          aria-pressed={!history}
          onClick={() => setHistory(false)}
        >
          Upcoming ({upcoming.length})
        </Button>
        <Button
          variant={history ? "default" : "outline"}
          aria-pressed={history}
          onClick={() => setHistory(true)}
        >
          Past
        </Button>
      </div>
      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">
          {history ? "Past appointments" : "Upcoming appointments"}
        </h2>
        {visible.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
        {!visible.length && (
          <EmptyAppointments history={history} hospitalPhone={hospitalPhone} />
        )}
        <p className="text-muted-foreground text-sm">
          Keep your patient number and appointment reference for reception. For help
          changing a booking, contact reception.
        </p>
        <Link href="/patient/book" className={buttonVariants({ variant: "outline" })}>
          Find another doctor
        </Link>
      </Card>
    </>
  );
}
