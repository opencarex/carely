"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Panel } from "@/components/workspace/workspace-ui";
import { useReceptionDemo } from "@/components/reception/reception-demo-provider";

export function OnSiteChanneling() {
  const router = useRouter();

  const { patients, doctors, selectedPatient, selectPatient, assignSlot, bookings } =
    useReceptionDemo();
  const [changing, setChanging] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const doctor = doctors.find((item) => item.id === doctorId)!;
  const receipt = bookings.find((item) => item.id === receiptId);
  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs">Selected patient</p>
          <p className="mt-1 text-sm font-semibold">
            {selectedPatient.name} &middot; {selectedPatient.id}
          </p>
        </div>
        <Dialog open={changing} onOpenChange={setChanging}>
          <DialogTrigger render={<Button variant="outline" />}>
            Change patient
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change patient</DialogTitle>
              <DialogDescription>
                Select an existing patient for this booking.
              </DialogDescription>
            </DialogHeader>
            <Input
              id="channeling-patient-search"
              label="Search patient"
              placeholder="Search name or patient ID"
              value={patientQuery}
              onChange={(event) => setPatientQuery(event.target.value)}
            />
            <div className="space-y-2">
              {patients
                .filter((item) =>
                  `${item.name} ${item.id}`
                    .toLowerCase()
                    .includes(patientQuery.toLowerCase())
                )
                .map((patient) => (
                  <Button
                    key={patient.id}
                    variant="outline"
                    className="h-auto w-full justify-start py-3 text-left whitespace-normal"
                    onClick={() => {
                      selectPatient(patient.id);
                      setReceiptId(null);
                      setChanging(false);
                    }}
                  >
                    {patient.name} &middot; {patient.id}
                  </Button>
                ))}
              {!patients.some((item) =>
                `${item.name} ${item.id}`
                  .toLowerCase()
                  .includes(patientQuery.toLowerCase())
              ) && (
                <p role="status" className="text-muted-foreground text-sm">
                  No matching patients.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </Card>
      {receipt && (
        <Panel title="Booking saved">
          <p className="text-sm font-semibold">
            {receipt.id} &middot; {receipt.patientName}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {doctors.find((item) => item.id === receipt.doctorId)?.name} &middot;{" "}
            {receipt.date} &middot; {receipt.time}
          </p>
          <p className="text-muted-foreground mt-3 text-sm">
            The booking is saved in this demo session. Check-in is a separate step; no
            queue entry has been created by booking.
          </p>
          <Button
            className="mt-4 w-full sm:w-auto"
            onClick={() => router.push(`/reception/appointments?booking=${receipt.id}`)}
          >
            Review appointment &amp; check in
          </Button>
        </Panel>
      )}
      <Dialog open={assigning} onOpenChange={setAssigning}>
        <Panel title="Available today">
          <div className="space-y-3">
            {doctors.slice(0, 4).map((item) => (
              <article
                key={item.id}
                className="bg-carely-surface flex flex-col gap-4 rounded-xl p-4 lg:flex-row lg:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar
                    alt={item.name}
                    fallback={item.name
                      .replace(/^Dr\.\s*/, "")
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  />
                  <div>
                    <h3 className="text-sm font-semibold">{item.name}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{item.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm lg:gap-8">
                  <div>
                    <p>Next {item.next}</p>
                    <p className="text-carely-success mt-1 text-xs">{item.slots} slots</p>
                  </div>
                  <DialogTrigger
                    render={<Button disabled={item.slots === 0} />}
                    aria-label={`Assign slot with ${item.name}`}
                    onClick={() => {
                      setDoctorId(item.id);
                      setError("");
                    }}
                  >
                    Assign slot
                  </DialogTrigger>
                </div>
              </article>
            ))}
          </div>
          <p className="text-muted-foreground mt-5 text-sm">
            Assigning a slot saves the booking. Check in the patient separately to create
            a queue entry.
          </p>
        </Panel>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm appointment</DialogTitle>
            <DialogDescription>
              Book this available slot for the selected patient.
            </DialogDescription>
          </DialogHeader>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Patient</dt>
              <dd className="mt-1">
                {selectedPatient.name} &middot; {selectedPatient.id}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Doctor and time</dt>
              <dd className="mt-1">
                {doctor.name} &middot; {doctor.next}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Location</dt>
              <dd className="mt-1">{doctor.room}</dd>
            </div>
          </dl>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              disabled={doctor.slots === 0}
              onClick={() => {
                const booking = assignSlot(doctor.id);
                if (!booking) {
                  setError("This slot is no longer available.");
                  return;
                }
                setReceiptId(booking.id);
                setAssigning(false);
              }}
            >
              Confirm booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
