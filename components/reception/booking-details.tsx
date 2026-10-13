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
import type { ReceptionBooking, ReceptionDoctor } from "@/lib/mock/reception";

export function BookingDetails({
  booking,
  doctor,
  onCheckIn,
}: {
  booking: ReceptionBooking;
  doctor: ReceptionDoctor;
  onCheckIn: (bookingId: string) => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <>
      <Badge
        className={
          booking.status === "Checked in"
            ? "bg-carely-success-soft text-carely-success"
            : ""
        }
      >
        {booking.status}
      </Badge>
      <h3 className="mt-4 font-semibold">
        {booking.patientName} &middot; {booking.patientId}
      </h3>
      <p className="mt-3 text-sm">
        {doctor.name} &middot; {doctor.specialty}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        {booking.date} &middot; {booking.time} &middot; {doctor.room}
      </p>
      <div className="bg-carely-surface mt-5 rounded-xl p-4">
        <h4 className="text-sm font-semibold">Payment at the hospital</h4>
        <p className="text-muted-foreground mt-2 text-sm">
          If a fee applies, use the hospital&apos;s existing payment process. Carely does
          not record payment.
        </p>
      </div>
      {booking.token && (
        <p className="text-primary mt-4 text-sm font-semibold">
          Queue token: {booking.token}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              className="mt-5 w-full sm:w-auto"
              disabled={booking.status !== "Booked"}
            />
          }
        >
          Check In Patient
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check in patient</DialogTitle>
            <DialogDescription>
              Confirm the patient has arrived. Check-in creates one queue entry for the
              booked doctor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">
              {booking.patientName} &middot; {booking.patientId}
            </p>
            <p>
              {booking.id} &middot; {booking.time}
            </p>
            <p>
              {doctor.name} &middot; {doctor.room}
            </p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              disabled={booking.status !== "Booked"}
              onClick={() => {
                const token = onCheckIn(booking.id);
                setOpen(false);
                setMessage(
                  token
                    ? `Patient checked in. Queue token: ${token}`
                    : "This booking cannot be checked in again."
                );
              }}
            >
              Confirm check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="text-muted-foreground mt-4 text-xs">
        Cancelled or already checked-in bookings cannot be checked in again.
      </p>
      {message && (
        <p role="status" className="text-primary mt-4 text-sm">
          {message}
        </p>
      )}
    </>
  );
}
