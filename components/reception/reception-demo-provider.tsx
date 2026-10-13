"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  receptionPatients,
  receptionDoctors,
  receptionBookings,
  receptionQueues,
  type ReceptionPatient,
  type ReceptionBooking,
  type QueuePatient,
} from "@/lib/mock/reception";

type ReceptionState = {
  patients: ReceptionPatient[];
  doctors: typeof receptionDoctors;
  bookings: ReceptionBooking[];
  queues: typeof receptionQueues;
  selectedPatient: ReceptionPatient;
  selectPatient: (id: string) => void;
  registerPatient: (
    patient: Omit<ReceptionPatient, "id" | "lastVisit">
  ) => ReceptionPatient;
  assignSlot: (doctorId: string) => ReceptionBooking | null;
  checkIn: (bookingId: string) => string | null;
  updateQueuePatient: (
    doctorId: string,
    patientId: string,
    status: QueuePatient["status"]
  ) => void;
};
const ReceptionContext = createContext<ReceptionState | null>(null);
/** Temporary demo state for registration, booking, check-in and queues. Replace with database-backed visits; see docs/pharmacy-reception-ui.md. */
export function ReceptionDemoProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState(receptionPatients);
  const [doctors, setDoctors] = useState(receptionDoctors);
  const [bookings, setBookings] = useState(receptionBookings);
  const [queues, setQueues] = useState(receptionQueues);
  const [selectedPatientId, selectPatient] = useState(receptionPatients[0].id);
  const selectedPatient = patients.find((item) => item.id === selectedPatientId)!;
  function registerPatient(values: Omit<ReceptionPatient, "id" | "lastVisit">) {
    const patient = {
      ...values,
      id: `P-${String(169 + patients.length - receptionPatients.length).padStart(5, "0")}`,
      lastVisit: "No previous visits",
    };
    setPatients((previous) => [...previous, patient]);
    selectPatient(patient.id);
    return patient;
  }
  function assignSlot(doctorId: string) {
    const doctor = doctors.find((item) => item.id === doctorId);
    if (!doctor || doctor.slots <= 0) return null;
    const booking: ReceptionBooking = {
      id: `APT-${1051 + bookings.length - receptionBookings.length}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId,
      date: "2026-10-12",
      time: doctor.next,
      status: "Booked",
    };
    setBookings((previous) => [...previous, booking]);
    setDoctors((previous) =>
      previous.map((item) => {
        if (item.id !== doctorId) return item;
        const [hour, minute] = item.next.split(":").map(Number);
        const next = hour * 60 + minute + 15;
        return {
          ...item,
          slots: item.slots - 1,
          next: `${String(Math.floor(next / 60)).padStart(2, "0")}:${String(next % 60).padStart(2, "0")}`,
        };
      })
    );
    return booking;
  }
  function checkIn(bookingId: string) {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking || booking.status !== "Booked") return null;
    const doctor = doctors.find((item) => item.id === booking.doctorId)!;
    const queue = queues.find((item) => item.doctorId === doctor.id)!;
    const last = Math.max(
      Number(queue.serving.split("-").at(-1)),
      ...queue.patients.map((item) => Number(item.token.split("-").at(-1)))
    );
    const token = `${doctor.prefix}-${last + 1}`;
    setBookings((previous) =>
      previous.map((item) =>
        item.id === bookingId ? { ...item, status: "Checked in", token } : item
      )
    );
    setQueues((previous) =>
      previous.map((item) =>
        item.doctorId === doctor.id
          ? {
              ...item,
              patients: [
                ...item.patients,
                {
                  id: booking.id,
                  name: booking.patientName,
                  token,
                  priority: "Normal",
                  status: "Waiting",
                },
              ],
            }
          : item
      )
    );
    return token;
  }
  function updateQueuePatient(
    doctorId: string,
    patientId: string,
    status: QueuePatient["status"]
  ) {
    setQueues((previous) =>
      previous.map((queue) =>
        queue.doctorId === doctorId
          ? {
              ...queue,
              serving:
                status === "Called"
                  ? queue.patients.find((item) => item.id === patientId)!.token
                  : queue.serving,
              patients: queue.patients.map((item) =>
                item.id === patientId ? { ...item, status } : item
              ),
            }
          : queue
      )
    );
  }
  return (
    <ReceptionContext.Provider
      value={{
        patients,
        doctors,
        bookings,
        queues,
        selectedPatient,
        selectPatient,
        registerPatient,
        assignSlot,
        checkIn,
        updateQueuePatient,
      }}
    >
      {children}
    </ReceptionContext.Provider>
  );
}
export function useReceptionDemo() {
  const state = useContext(ReceptionContext);
  if (!state) throw new Error("Reception UI requires ReceptionDemoProvider");
  return state;
}
