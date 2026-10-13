"use client";
import { comparePatientAppointments } from "@/lib/mock/patient";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  FactCard,
  InitialAvatar,
  StatusBadge,
} from "@/components/patient/patient-shared";
import { usePatientDemo } from "@/components/patient/patient-demo-provider";
import {
  patientAppointments,
  patientDoctors,
  formatPatientDate,
} from "@/lib/mock/patient";

export function QueueStatus() {
  const params = useSearchParams();
  const preview = params.get("preview") === "checked-in";
  const { appointments } = usePatientDemo();
  const appointment = preview
    ? patientAppointments[0]
    : appointments
        .filter((item) => item.status === "Confirmed")
        .sort(comparePatientAppointments)[0];
  const doctor = patientDoctors.find((item) => item.id === appointment?.doctorId);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setLastUpdated(new Date().toLocaleTimeString("en-GB"));
    const initial = setTimeout(refresh, 0);
    const interval = setInterval(refresh, 30_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);
  return (
    <div className="space-y-5">
      {preview && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Checked-in design preview. Queue values are sample data.
        </p>
      )}
      {appointment && doctor ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">
              {preview ? "OPD queue" : "Check in at reception"}
            </h2>
            <StatusBadge tone={preview ? "green" : "blue"}>
              {preview ? "Queue active" : "Not checked in"}
            </StatusBadge>
          </div>
          {preview ? (
            <>
              <div className="bg-primary grid gap-4 rounded-xl p-5 text-white sm:grid-cols-2">
                <div>
                  <p className="text-sm">Your token</p>
                  <p className="mt-2 text-4xl font-bold">A-18</p>
                  <p className="mt-3 text-xs">Checked in at 09:12 AM</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-sm">Current position</p>
                  <p className="mt-2 text-3xl font-bold">3rd</p>
                  <p className="mt-2 text-sm">Approx. 18 minutes</p>
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <h3 className="font-semibold">Queue progress</h3>
                  <span className="text-muted-foreground">15 of 20 completed</span>
                </div>
                <progress
                  className="accent-primary mt-3 h-2.5 w-full"
                  value={15}
                  max={20}
                  aria-label="Completed consultations"
                />
                {[
                  {
                    token: "A16",
                    title: "Now serving",
                    detail: "Patient is currently with the doctor",
                  },
                  {
                    token: "A17",
                    title: "Ahead of you",
                    detail: "Please remain nearby in the waiting lobby",
                  },
                ].map((item) => (
                  <div key={item.token} className="mt-4 flex items-center gap-3">
                    <InitialAvatar>{item.token}</InitialAvatar>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-muted-foreground text-xs">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your appointment is booked. A queue token is issued after reception confirms
              your arrival.
            </p>
          )}
          <div className="bg-carely-surface rounded-xl border p-4">
            <h3 className="font-semibold">{doctor.name}</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {doctor.specialty} &middot; {doctor.room}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FactCard
                label="Appointment"
                value={formatPatientDate(appointment.date) + " / " + appointment.time}
              />
              <FactCard label="Reference" value={appointment.id} />
            </div>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/patient/appointments"
          >
            View appointment
          </Link>
          {!preview && (
            <p className="text-muted-foreground text-sm">
              If applicable, fees are collected at the hospital.
            </p>
          )}
        </>
      ) : (
        <>
          <h2 className="font-semibold">No active queue</h2>
          <p className="text-muted-foreground text-sm">
            Book an appointment, then check in with reception when you arrive.
          </p>
          <Link className={buttonVariants({})} href="/patient/book">
            Find a doctor
          </Link>
        </>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <Button
          variant="outline"
          onClick={() => setLastUpdated(new Date().toLocaleTimeString("en-GB"))}
        >
          Refresh now
        </Button>
        <p aria-live="polite" className="text-muted-foreground text-xs">
          {lastUpdated ? "Last refreshed " + lastUpdated : "Checking status..."}
        </p>
      </div>
    </div>
  );
}
