import { z } from "zod";
import { bookAppointmentSchema } from "@/lib/schemas/booking";
import type { QueueStatus } from "@/lib/schemas/queue";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || undefined);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    );
  }, "Date of birth must be a real calendar date");

export const createWalkInPatientSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(120),
    phone: optionalText(24),
    dateOfBirth: isoDate.optional(),
    gender: optionalText(40),
    address: optionalText(240),
    emergencyContactName: optionalText(120),
    emergencyContactPhone: optionalText(24),
    /** A receptionist may continue after reviewing an exact duplicate warning. */
    confirmDuplicate: z.boolean().optional().default(false),
  })
  .strict();

export const patientSearchSchema = z.object({
  q: z.string().trim().min(1, "Enter a patient number, phone number, or name").max(120),
});

export const receptionPatientIdSchema = z.object({ id: z.uuid("Invalid patient ID") });

export const receptionBookingSchema = bookAppointmentSchema.strict();

export const receptionAppointmentSearchSchema = z.object({
  q: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export type ReceptionAppointmentSearch = z.infer<typeof receptionAppointmentSearchSchema>;

export type ReceptionAppointment = {
  id: string;
  patientName: string;
  patientNo: string;
  doctorName: string;
  date: string;
  appointmentNo: number;
  status: string;
  queueStatus: QueueStatus | null;
};

export type ReceptionAppointmentSearchResponse = {
  appointments: ReceptionAppointment[];
  hasMore: boolean;
};

export type CreateWalkInPatientInput = z.infer<typeof createWalkInPatientSchema>;

export type ReceptionPatientSummary = {
  id: string;
  patientNo: string;
  fullName: string;
  dateOfBirth: string | null;
  phone: string | null;
};

export type ReceptionPatientDetails = ReceptionPatientSummary & {
  gender: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  hasPortalAccount: boolean;
};
