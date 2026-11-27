import { z } from "zod";
import type { Appointment } from "@/lib/db/schema/appointment";

export const bookAppointmentSchema = z.object({
  doctorId: z.uuid("Invalid doctor ID"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Appointment date must be in YYYY-MM-DD format")
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return (
        value >= "0001-01-01" &&
        Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    }, "Appointment date must be a real calendar date"),
  patientId: z.uuid("Invalid patient ID"),
  visitReasonId: z.uuid("Invalid visit reason ID").optional(),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const openDatesQuerySchema = bookAppointmentSchema.pick({ doctorId: true });
export const patientBookingSchema = bookAppointmentSchema
  .omit({ patientId: true, visitReasonId: true })
  .extend({ visitReasonId: z.uuid("Invalid visit reason ID") })
  .strict();
export const cancelAppointmentSchema = z.object({
  appointmentId: z.uuid("Invalid appointment ID"),
});

export interface BookAppointmentActor {
  userId: string;
  role: "patient" | "receptionist" | "admin" | "doctor" | "nurse" | "pharmacist" | string;
}

export interface BookAppointmentParams {
  doctorId: string;
  date: string; // YYYY-MM-DD
  patientId: string;
  visitReasonId?: string;
  actor: BookAppointmentActor;
}

export interface BookAppointmentResult {
  success: boolean;
  appointment?: Appointment;
  appointmentNo?: number;
  error?: string;
  code?: string;
  /** HTTP status for expected failures; the service itself does not send a response. */
  statusCode?: number;
}

export interface OpenDateEntry {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0..6
  startTime: string;
  endTime: string;
  maxPatients: number;
  bookedCount: number;
  availableCount: number;
}

export interface OpenDatesResponse {
  doctorId: string;
  doctorName?: string;
  specialtyName?: string;
  bookingWindow: { startDate: string; endDate: string };
  unavailableDates: { date: string; status: "full" | "ended" }[];
  dates: OpenDateEntry[];
}

export interface CancelAppointmentParams {
  appointmentId: string;
  actor: BookAppointmentActor;
}

export interface PatientDoctorOption {
  id: string;
  name: string;
  specialtyName: string | null;
  consultationFee: string | null;
}

export interface PatientVisitReason {
  id: string;
  name: string;
  specialtyName: string;
}

export interface PatientAppointmentView {
  id: string;
  doctorId: string;
  doctorName: string;
  specialtyName: string | null;
  date: string;
  appointmentNo: number;
  status: string;
  feeAmount: string | null;
  startTime: string | null;
  endTime: string | null;
  isUpcoming: boolean;
  canCancel: boolean;
}
