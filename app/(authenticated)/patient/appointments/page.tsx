"use client";
import { comparePatientAppointments } from "@/lib/mock/patient";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { EmptyAppointments } from "@/components/patient/empty-appointments";
import { StepGuide } from "@/components/patient/patient-shared";
import { usePatientDemo } from "@/components/patient/patient-demo-provider";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { appContent } from "@/lib/mock/content";
export default function PatientAppointmentsPage() {
  const { appointments } = usePatientDemo();
  const [history, setHistory] = useState(false);
  const upcoming = appointments
    .filter((item) => item.status === "Confirmed")
    .sort(comparePatientAppointments);
  const visible = history
    ? appointments.filter((item) => item.status !== "Confirmed")
    : upcoming;
  return (
    <>
      <PageTitle
        eyebrow="My care"
        title="Appointments"
        description="Review upcoming bookings and manage appointments before check-in."
      />
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
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
        <Card className="min-w-0 p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">
            {history ? "Past appointments" : "Upcoming appointments"}
          </h2>
          <div className="space-y-3">
            {visible.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
          {!visible.length && <EmptyAppointments history={history} />}
          {!history && visible.length > 0 && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Appointments can be cancelled before check-in. Contact reception if you need
              assistance.
            </p>
          )}
        </Card>
        <Card className="min-w-0 p-5 sm:p-6">
          <h2 className="font-semibold">Before your visit</h2>
          <div className="mt-5 space-y-6">
            <StepGuide
              number="01"
              title="Arrive early"
              copy="Please arrive 15 minutes before your scheduled appointment."
            />
            <StepGuide
              number="02"
              title="Bring identification"
              copy="Keep your hospital patient number available at check-in."
            />
            <StepGuide
              number="03"
              title="Check in at reception"
              copy="Your queue token is issued after reception confirms your arrival. If applicable, fees are collected at the hospital."
            />
          </div>
          <Link
            className={buttonVariants({ className: "mt-6", size: "sm" })}
            href="/patient/book"
          >
            Find another doctor
          </Link>
          <div className="mt-4 rounded-xl border p-4">
            <p className="text-sm font-semibold">Need to change a booking?</p>
            <a
              className="text-primary mt-2 inline-block font-bold"
              href={"tel:" + appContent.hospital.phone.replace(/[^+0-9]/g, "")}
            >
              {appContent.hospital.phone}
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}
