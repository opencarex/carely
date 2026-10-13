"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { FactCard, StatusBadge } from "@/components/patient/patient-shared";
import { usePatientDemo } from "@/components/patient/patient-demo-provider";
import {
  patientDoctors,
  formatPatientDate,
  type PatientAppointment,
} from "@/lib/mock/patient";

export function AppointmentCard({ appointment }: { appointment: PatientAppointment }) {
  const { cancelAppointment } = usePatientDemo();
  const [cancelOpen, setCancelOpen] = useState(false);
  const doctor = patientDoctors.find((item) => item.id === appointment.doctorId)!;
  return (
    <article className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row">
      <div className="bg-secondary text-primary flex size-15 shrink-0 flex-col items-center justify-center rounded-xl">
        <span className="text-xl font-bold">{appointment.date.slice(8)}</span>
        <span className="text-xs font-semibold">OCT</span>
      </div>
      <div className="min-w-0 flex-1">
        <StatusBadge tone={appointment.status === "Confirmed" ? "green" : "blue"}>
          {appointment.status}
        </StatusBadge>
        <h3 className="mt-2 font-semibold">{doctor.name}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {doctor.specialty} &middot; {doctor.room}
        </p>
        <p className="mt-2 text-sm font-medium">
          {formatPatientDate(appointment.date)} &middot; {appointment.time}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">Reference {appointment.id}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              View details
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Appointment {appointment.id}</DialogTitle>
                <DialogDescription>
                  {appointment.status} appointment with {doctor.name}.
                </DialogDescription>
              </DialogHeader>
              <FactCard
                label="Date and time"
                value={formatPatientDate(appointment.date) + " / " + appointment.time}
              />
              <FactCard label="Location" value={doctor.specialty + " / " + doctor.room} />
              {appointment.status === "Confirmed" && (
                <p className="text-muted-foreground text-sm">
                  Check in at reception with your patient ID or appointment reference.
                  Your queue token is issued after check-in.
                </p>
              )}
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
                {appointment.status === "Confirmed" && (
                  <Link href="/patient/queue" className={buttonVariants({})}>
                    View queue status
                  </Link>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {appointment.status === "Confirmed" && (
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel appointment?</DialogTitle>
                  <DialogDescription>
                    Cancel {appointment.id} with {doctor.name} on{" "}
                    {formatPatientDate(appointment.date)} at {appointment.time}. You can
                    book another available slot later.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Keep appointment
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      cancelAppointment(appointment.id);
                      setCancelOpen(false);
                    }}
                  >
                    Cancel appointment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </article>
  );
}
