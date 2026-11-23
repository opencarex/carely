import { z } from "zod";

export const doctorVisitParamsSchema = z.object({ queueEntryId: z.uuid() }).strict();
export const doctorPatientHistoryParamsSchema = z
  .object({ patientId: z.uuid() })
  .strict();

export type ReviewNote = { id: string; content: string; createdAt: string };
export type DoctorVisitReview = {
  encounterId: string;
  queueEntryId: string;
  intake: { content: string; createdAt: string } | null;
  vitals: Record<string, unknown> | null;
  notes: ReviewNote[];
};
export type DoctorVisitResponse = { visit: DoctorVisitReview };

export type DoctorPatientSummary = { id: string; fullName: string; patientNo: string };

export type PatientHistoryEncounter = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  notes: ReviewNote[];
  vitals: {
    bpSystolic: number | null;
    bpDiastolic: number | null;
    heartRate: number | null;
    spo2: number | null;
    temperatureC: string | null;
    recordedAt: string;
  } | null;
  prescriptions: {
    id: string;
    createdAt: string;
    status: string;
    items: {
      id: string;
      name: string;
      strength: string | null;
      dosage: string;
      frequency: string;
    }[];
  }[];
};
export type PatientHistory = {
  patientId: string;
  patient: DoctorPatientSummary;
  encounters: PatientHistoryEncounter[];
};
export type PatientHistoryResponse = { history: PatientHistory };
