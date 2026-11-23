"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { appointmentStatus, formatPatientDate } from "@/lib/patient-appointments";
import type { ReceptionAppointment } from "@/lib/schemas/reception";

export function bookingStatus(booking: ReceptionAppointment) {
  if (booking.status === "booked" && booking.queueStatus) return "Checked in";
  return appointmentStatus(booking.status);
}

export function BookingDetails({
  booking,
  onCheckedIn,
}: {
  booking: ReceptionAppointment;
  onCheckedIn: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [error, setError] = useState("");
  const canCheckIn = booking.status === "booked" && !booking.queueStatus && !checkedIn;

  async function checkIn() {
    if (pending || !canCheckIn) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/queue/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: booking.id }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Unable to check in this appointment.");
      }
      setCheckedIn(true);
      setOpen(false);
      await onCheckedIn();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to check in this appointment."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Badge>
        {checkedIn && booking.status === "booked" ? "Checked in" : bookingStatus(booking)}
      </Badge>
      <h3 className="mt-4 font-semibold">
        {booking.patientName} · {booking.patientNo}
      </h3>
      <p className="mt-2 text-sm">
        {booking.doctorName} · {formatPatientDate(booking.date)}
      </p>
      <p className="mt-2 text-sm">Appointment #{booking.appointmentNo}</p>
      <p className="text-muted-foreground mt-1 text-xs break-all">
        Reference {booking.id}
      </p>
      {canCheckIn && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="mt-5" />}>
            Check in patient
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check in patient</DialogTitle>
              <DialogDescription>
                Add {booking.patientName} to {booking.doctorName}’s live queue for
                appointment #{booking.appointmentNo}.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" disabled={pending} />}>
                Cancel
              </DialogClose>
              <Button disabled={pending} onClick={() => void checkIn()}>
                {pending ? "Checking in..." : "Confirm check-in"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {checkedIn && (
        <p role="status" className="text-primary mt-4 text-sm">
          Patient added to the live queue.
        </p>
      )}
    </>
  );
}
