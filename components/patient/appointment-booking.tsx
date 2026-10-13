"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FactCard } from "@/components/patient/patient-shared";
import { usePatientDemo } from "@/components/patient/patient-demo-provider";
import { formatPatientDate, type PatientDoctor } from "@/lib/mock/patient";
import { appContent } from "@/lib/mock/content";
import { cn } from "@/lib/utils";

export function AppointmentBooking({ doctor }: { doctor: PatientDoctor }) {
  const { appointments, bookAppointment } = usePatientDemo();
  const router = useRouter();
  const [date, setDate] = useState(doctor.dates[0]);
  const [time, setTime] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const reserved = (slot: string) =>
    appointments.some(
      (item) =>
        item.status === "Confirmed" &&
        item.doctorId === doctor.id &&
        item.date === date &&
        item.time === slot
    );
  const dates = doctor.dates.map((value) => ({ value, label: formatPatientDate(value) }));
  function confirm() {
    if (!time || reserved(time)) {
      setError("This slot is no longer available. Choose another time.");
      return;
    }
    const id = bookAppointment({ doctorId: doctor.id, date, time });
    if (!id) {
      setError("This appointment is already booked.");
      return;
    }
    setOpen(false);
    router.push("/patient/appointments/confirmed");
  }
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold">Book appointment</h2>
        <p className="mt-2 text-sm font-medium">{doctor.name}</p>
        <p className="text-muted-foreground text-sm">{doctor.specialty}</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="appointment-date" className="text-sm font-semibold">
          1. Choose date
        </label>
        <Select
          items={dates}
          value={date}
          onValueChange={(value) => {
            if (value) {
              setDate(value);
              setTime(null);
              setError("");
            }
          }}
        >
          <SelectTrigger id="appointment-date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            {dates.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">2. Choose time</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {doctor.times.map((slot) => (
            <Button
              key={slot}
              variant={time === slot ? "default" : "outline"}
              disabled={reserved(slot)}
              aria-pressed={time === slot}
              className={cn(
                "h-auto min-h-11 flex-col gap-0.5 py-2 text-xs",
                reserved(slot) && "line-through"
              )}
              onClick={() => {
                setTime(slot);
                setError("");
              }}
            >
              {slot}
              {reserved(slot) && <span className="text-xs">Booked</span>}
            </Button>
          ))}
        </div>
      </fieldset>
      <FactCard
        label="Booking summary"
        value={formatPatientDate(date) + " / " + (time ?? "Choose a time")}
      />
      <p className="text-muted-foreground text-sm">
        {appContent.hospital.name} &middot; {doctor.room}
      </p>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          setError("");
        }}
      >
        <DialogTrigger render={<Button className="w-full" disabled={!time} />}>
          Confirm appointment
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your appointment</DialogTitle>
            <DialogDescription>
              Review your booking. Reception issues your queue token after you arrive and
              check in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <FactCard label="Doctor" value={doctor.name} />
            <FactCard
              label="Date and time"
              value={formatPatientDate(date) + " / " + (time ?? "")}
            />
            <p className="text-muted-foreground text-sm">
              If applicable, fees are collected at the hospital.
            </p>
          </div>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Go back</DialogClose>
            <Button onClick={confirm}>Book appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
