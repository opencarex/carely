"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { DoctorFinder } from "@/components/patient/doctor-finder";
import { AppointmentBooking } from "@/components/patient/appointment-booking";
import { PageTitle } from "@/components/workspace/workspace-ui";
import type { PatientDoctor } from "@/lib/mock/patient";

export default function PatientBookPage() {
  const [mode, setMode] = useState<"guided" | "browse">("guided");
  const [doctor, setDoctor] = useState<PatientDoctor | null>(null);
  const booking = useRef<HTMLElement>(null);
  return (
    <>
      <PageTitle
        eyebrow="Appointments"
        title={mode === "guided" ? "Guided doctor finder" : "Find a doctor"}
        description="Choose a reason for your visit or browse doctors by specialty and availability."
        action={
          <Image
            src="/images/live-queue.svg"
            alt="Carely doctor finder assistant"
            width={74}
            height={100}
            priority
          />
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="min-w-0 p-5 sm:p-6">
          <DoctorFinder
            mode={mode}
            onModeChange={setMode}
            selectedId={doctor?.id}
            onSelect={(selected) => {
              setDoctor(selected);
              requestAnimationFrame(() =>
                booking.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              );
            }}
          />
        </Card>
        <Card ref={booking} className="min-w-0 scroll-mt-5 p-5 sm:p-6">
          {doctor ? (
            <AppointmentBooking key={doctor.id} doctor={doctor} />
          ) : (
            <>
              <h2 className="font-semibold">Book appointment</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Choose a doctor to see available dates and times.
              </p>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
