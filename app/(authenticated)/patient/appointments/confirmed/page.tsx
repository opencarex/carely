"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FactCard, StatusBadge, StepGuide } from "@/components/patient/patient-shared";
import { usePatientDemo } from "@/components/patient/patient-demo-provider";
import { PrintPrescriptionButton } from "@/components/workspace/print-prescription-button";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { patientDoctors, formatPatientDate } from "@/lib/mock/patient";
import { appContent } from "@/lib/mock/content";
export default function AppointmentConfirmedPage() {
  const { appointments, lastBookingId } = usePatientDemo();
  const appointment = appointments.find(
    (item) => item.id === lastBookingId && item.status === "Confirmed"
  );
  if (!appointment)
    return (
      <>
        <PageTitle
          title="Booking confirmation"
          description="Book an appointment to view its confirmation here."
        />
        <Card className="p-6">
          <Link className={buttonVariants({})} href="/patient/appointments">
            View appointments
          </Link>
        </Card>
      </>
    );
  const doctor = patientDoctors.find((item) => item.id === appointment.doctorId)!;
  return (
    <>
      <PageTitle
        eyebrow="Booking complete"
        title="Appointment confirmed"
        description="Keep the reference number for reception."
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="min-w-0 p-5 sm:p-8">
          <span className="bg-carely-success-soft text-carely-success grid size-16 place-items-center rounded-full">
            <Check aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-bold">You&apos;re booked!</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Appointment saved for this demo session. Keep your reference number below.
          </p>
          <div className="bg-carely-surface mt-5 rounded-xl border p-5">
            <p className="font-semibold">{doctor.name}</p>
            <p className="text-muted-foreground my-2 text-sm">
              {doctor.specialty} &middot; {appContent.hospital.name}
            </p>
            <StatusBadge tone="green">Confirmed</StatusBadge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <FactCard label="Date" value={formatPatientDate(appointment.date)} />
            <FactCard label="Time" value={appointment.time} />
            <FactCard label="Reference" value={appointment.id} />
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link className={buttonVariants({})} href="/patient/appointments">
              View appointments
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/patient">
              Back to dashboard
            </Link>
            <PrintPrescriptionButton label="Print confirmation" variant="outline" />
          </div>
        </Card>
        <Card className="min-w-0 p-5 sm:p-6">
          <h2 className="font-semibold">Before your visit</h2>
          <div className="mt-5 space-y-6">
            <StepGuide
              number="01"
              title="Arrive early"
              copy="Please arrive 15 minutes before your appointment."
            />
            <StepGuide
              number="02"
              title="Bring identification"
              copy="Keep your hospital patient number available."
            />
            <StepGuide
              number="03"
              title="Check in at reception"
              copy="A queue token is issued after check-in. If applicable, fees are collected at the hospital."
            />
          </div>
        </Card>
      </div>
    </>
  );
}
