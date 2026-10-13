"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { patientAppointments, type PatientAppointment } from "@/lib/mock/patient";
type PatientDemo = {
  appointments: PatientAppointment[];
  lastBookingId: string | null;
  bookAppointment: (
    appointment: Omit<PatientAppointment, "id" | "status">
  ) => string | null;
  cancelAppointment: (id: string) => void;
};
const PatientDemoContext = createContext<PatientDemo | null>(null);
// Temporary UI prototype store. Replace with server-owned bookings when data integration starts.
export function PatientDemoProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState(patientAppointments);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  function bookAppointment(details: Omit<PatientAppointment, "id" | "status">) {
    if (
      appointments.some(
        (item) =>
          item.status === "Confirmed" &&
          item.doctorId === details.doctorId &&
          item.date === details.date &&
          item.time === details.time
      )
    )
      return null;
    const id =
      "APT-" +
      (Math.max(1048, ...appointments.map((item) => Number(item.id.slice(4)))) + 1);
    setAppointments((items) => [...items, { ...details, id, status: "Confirmed" }]);
    setLastBookingId(id);
    return id;
  }
  function cancelAppointment(id: string) {
    setAppointments((items) =>
      items.map((item) =>
        item.id === id && item.status === "Confirmed"
          ? { ...item, status: "Cancelled" }
          : item
      )
    );
  }
  return (
    <PatientDemoContext
      value={{ appointments, lastBookingId, bookAppointment, cancelAppointment }}
    >
      {children}
    </PatientDemoContext>
  );
}
export function usePatientDemo() {
  const context = useContext(PatientDemoContext);
  if (!context) throw new Error("Patient UI must be inside PatientDemoProvider");
  return context;
}
