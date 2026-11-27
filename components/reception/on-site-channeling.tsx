"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingRows } from "@/components/workspace/loading-skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/workspace/workspace-ui";
import { formatPatientDate, formatSession } from "@/lib/patient-appointments";
import type {
  BookAppointmentResult,
  OpenDateEntry,
  PatientDoctorOption,
} from "@/lib/schemas/booking";
import type {
  ReceptionPatientDetails,
  ReceptionPatientSummary,
} from "@/lib/schemas/reception";

type BookingReceipt = NonNullable<BookAppointmentResult["appointment"]> & {
  appointmentNo: number;
};

function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function OnSiteChanneling() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const [patient, setPatient] = useState<ReceptionPatientDetails | null>(null);
  const [doctors, setDoctors] = useState<PatientDoctorOption[] | null>(null);
  const [doctorError, setDoctorError] = useState("");
  const [patientError, setPatientError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientMatches, setPatientMatches] = useState<ReceptionPatientSummary[]>([]);
  const [bookingDoctor, setBookingDoctor] = useState<PatientDoctorOption | null>(null);
  const [openDates, setOpenDates] = useState<OpenDateEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDoctors() {
      try {
        const response = await fetch("/api/reception/doctors", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data: { doctors?: PatientDoctorOption[]; error?: string } =
          await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load doctors.");
        if (!controller.signal.aborted) setDoctors(data.doctors ?? []);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setDoctorError(
            cause instanceof Error ? cause.message : "Unable to load doctors."
          );
        }
      }
    }
    void loadDoctors();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!patientId) return;
    const requestedPatientId = patientId;
    const controller = new AbortController();
    const patientUrl = `/api/reception/patients/${encodeURIComponent(requestedPatientId)}`;
    async function loadPatient() {
      try {
        const response = await fetch(patientUrl, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data: { patient?: ReceptionPatientDetails; error?: string } =
          await response.json();
        if (!response.ok || !data.patient)
          throw new Error(data.error ?? "Unable to load patient.");
        if (!controller.signal.aborted) {
          setPatient(data.patient);
          setPatientError(null);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setPatientError({
            id: requestedPatientId,
            message: cause instanceof Error ? cause.message : "Unable to load patient.",
          });
        }
      }
    }
    void loadPatient();
    return () => controller.abort();
  }, [patientId]);

  async function findPatients() {
    const term = patientQuery.trim();
    if (!term || pending) return;
    setPending(true);
    try {
      const response = await fetch(
        `/api/reception/patients/search?q=${encodeURIComponent(term)}`,
        {
          cache: "no-store",
        }
      );
      const data: { patients?: ReceptionPatientSummary[]; error?: string } =
        await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to search patients.");
      setPatientMatches(data.patients ?? []);
      setBookingError("");
    } catch (cause) {
      setBookingError(
        cause instanceof Error ? cause.message : "Unable to search patients."
      );
    } finally {
      setPending(false);
    }
  }

  async function chooseDoctor(doctor: PatientDoctorOption) {
    setBookingDoctor(doctor);
    setOpenDates([]);
    setSelectedDate("");
    setBookingError("");
    setPending(true);
    try {
      const response = await fetch(
        `/api/appointments/open-dates?doctorId=${encodeURIComponent(doctor.id)}`,
        { cache: "no-store" }
      );
      const data: { dates?: OpenDateEntry[]; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load clinic dates.");
      setOpenDates(data.dates ?? []);
      setSelectedDate(data.dates?.[0]?.date ?? "");
    } catch (cause) {
      setBookingError(
        cause instanceof Error ? cause.message : "Unable to load clinic dates."
      );
    } finally {
      setPending(false);
    }
  }

  async function saveBooking() {
    const currentPatient = patient?.id === patientId ? patient : null;
    if (!currentPatient || !bookingDoctor || !selectedDate) return;
    setPending(true);
    setBookingError("");
    try {
      const response = await fetch("/api/reception/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentPatient.id,
          doctorId: bookingDoctor.id,
          date: selectedDate,
        }),
      });
      const data: BookAppointmentResult = await response.json();
      if (!response.ok || !data.success || !data.appointment) {
        throw new Error(data.error ?? "Unable to save the appointment.");
      }
      setReceipt({ ...data.appointment, appointmentNo: data.appointmentNo ?? 0 });
      setBookingDoctor(null);
    } catch (cause) {
      setBookingError(
        cause instanceof Error ? cause.message : "Unable to save the appointment."
      );
    } finally {
      setPending(false);
    }
  }

  async function cancelReceipt() {
    if (!receipt) return;
    setPending(true);
    setBookingError("");
    try {
      const response = await fetch(
        `/api/appointments/${encodeURIComponent(receipt.id)}/cancel`,
        {
          method: "POST",
        }
      );
      const data: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error ?? "Unable to cancel appointment.");
      setReceipt((current) => (current ? { ...current, status: "cancelled" } : null));
    } catch (cause) {
      setBookingError(
        cause instanceof Error ? cause.message : "Unable to cancel appointment."
      );
    } finally {
      setPending(false);
    }
  }

  const receiptDoctor = doctors?.find((doctor) => doctor.id === receipt?.doctorId);
  const receiptDate = openDates.find((date) => date.date === receipt?.appointmentDate);
  const selectedPatient = patient?.id === patientId ? patient : null;
  const selectedPatientError =
    patientError?.id === patientId ? patientError?.message : undefined;

  if (!patientId && !selectedPatient) {
    return (
      <Panel title="Select a patient">
        <p className="text-muted-foreground text-sm">
          Start from walk-in registration or search for an existing patient before
          channeling.
        </p>
        <Button className="mt-4" onClick={() => router.push("/reception/register")}>
          Go to walk-in registration
        </Button>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      {selectedPatientError && (
        <p role="alert" className="text-destructive text-sm">
          {selectedPatientError}
        </p>
      )}
      {patientId && !selectedPatient && !selectedPatientError && (
        <LoadingRows label="Loading patient details…" count={1} />
      )}
      {selectedPatient && (
        <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Selected patient</p>
            <p className="mt-1 text-sm font-semibold">
              {selectedPatient.fullName} · {selectedPatient.patientNo}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              DOB: {selectedPatient.dateOfBirth ?? "Not recorded"}
            </p>
          </div>
          <Dialog open={patientPickerOpen} onOpenChange={setPatientPickerOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              Change patient
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change patient</DialogTitle>
                <DialogDescription>
                  Search patient number, phone number, or name.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Input
                  id="channeling-patient-search"
                  label="Search patient"
                  value={patientQuery}
                  onChange={(event) => setPatientQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void findPatients();
                    }
                  }}
                />
                <Button onClick={() => void findPatients()} disabled={pending}>
                  {pending ? "Searching…" : "Find"}
                </Button>
              </div>
              <div className="space-y-2">
                {patientMatches.map((match) => (
                  <Button
                    key={match.id}
                    variant="outline"
                    className="h-auto w-full justify-start py-3 text-left whitespace-normal"
                    onClick={() => {
                      setPatientPickerOpen(false);
                      setReceipt(null);
                      router.replace(
                        `/reception/channeling?patientId=${encodeURIComponent(match.id)}`
                      );
                    }}
                  >
                    {match.fullName} · {match.patientNo} · {match.dateOfBirth ?? "No DOB"}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      )}
      {receipt && selectedPatient && (
        <Panel
          title={
            receipt.status === "cancelled" ? "Appointment cancelled" : "Booking saved"
          }
        >
          <p className="text-sm font-semibold">
            Token #{receipt.appointmentNo} · {selectedPatient.fullName}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {receiptDoctor?.name ?? "Doctor"} ·{" "}
            {formatPatientDate(receipt.appointmentDate)}
            {receiptDate
              ? ` · ${formatSession(receiptDate.startTime, receiptDate.endTime)}`
              : ""}
          </p>
          <p className="text-muted-foreground mt-3 text-sm">
            {receipt.status === "cancelled"
              ? "This appointment is cancelled and its token will not be reused."
              : "The appointment is saved. Check-in is handled separately at arrival."}
          </p>
          {bookingError && (
            <p role="alert" className="text-destructive mt-3 text-sm">
              {bookingError}
            </p>
          )}
          {receipt.status === "booked" && (
            <Button
              variant="outline"
              className="mt-4"
              disabled={pending}
              onClick={() => void cancelReceipt()}
            >
              {pending ? "Cancelling..." : "Cancel appointment"}
            </Button>
          )}
        </Panel>
      )}
      {selectedPatient && (
        <Dialog
          open={!!bookingDoctor}
          onOpenChange={(open) => {
            if (!pending && !open) setBookingDoctor(null);
          }}
        >
          <Panel title="Available doctors">
            {doctorError ? (
              <p role="alert" className="text-destructive text-sm">
                {doctorError}
              </p>
            ) : doctors === null ? (
              <LoadingRows
                label="Loading available doctors…"
                rowClassName="bg-carely-surface border-0"
              />
            ) : doctors.length > 0 ? (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <article
                    key={doctor.id}
                    className="bg-carely-surface flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar alt={doctor.name} fallback={initials(doctor.name)} />
                      <div>
                        <h3 className="text-sm font-semibold">{doctor.name}</h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {doctor.specialtyName ?? "General clinic"}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => void chooseDoctor(doctor)} disabled={pending}>
                      Choose date
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No active doctors are available.
              </p>
            )}
          </Panel>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm appointment</DialogTitle>
              <DialogDescription>
                Choose an open clinic date. The appointment token is allocated only when
                the booking is saved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {bookingDoctor && <p className="font-semibold">{bookingDoctor.name}</p>}
              {pending && openDates.length === 0 && (
                <LoadingRows label="Loading clinic dates…" count={2} />
              )}
              {openDates.map((date) => (
                <Button
                  key={date.date}
                  variant={selectedDate === date.date ? "default" : "outline"}
                  className="h-auto w-full flex-col items-start gap-1 p-3 whitespace-normal"
                  onClick={() => setSelectedDate(date.date)}
                >
                  <span>{formatPatientDate(date.date)}</span>
                  <span className="text-xs">
                    {formatSession(date.startTime, date.endTime)} · {date.availableCount}{" "}
                    places left
                  </span>
                </Button>
              ))}
              {!pending && openDates.length === 0 && !bookingError && (
                <p className="text-muted-foreground text-sm">
                  No open clinic dates are available in the next 14 days.
                </p>
              )}
            </div>
            {bookingError && (
              <p role="alert" className="text-destructive text-sm">
                {bookingError}
              </p>
            )}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" disabled={pending} />}>
                Cancel
              </DialogClose>
              <Button
                disabled={pending || !selectedDate}
                onClick={() => void saveBooking()}
              >
                {pending && selectedDate ? "Saving…" : "Save booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
