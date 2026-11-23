import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointment } from "@/lib/db/schema/appointment";
import { clinicalNote } from "@/lib/db/schema/clinical-note";
import { encounter } from "@/lib/db/schema/encounter";
import { medicine } from "@/lib/db/schema/medicine";
import { patient } from "@/lib/db/schema/patient";
import { preliminaryNote } from "@/lib/db/schema/preliminary-note";
import { prescription } from "@/lib/db/schema/prescription";
import { prescriptionItem } from "@/lib/db/schema/prescription-item";
import { queueEntry } from "@/lib/db/schema/queue-entry";
import { vitals } from "@/lib/db/schema/vitals";
import {
  doctorPatientHistoryParamsSchema,
  doctorVisitParamsSchema,
  type DoctorVisitReview,
  type PatientHistory,
} from "@/lib/schemas/record-review";
import {
  assertActiveActor,
  doctorCareRelationship,
  getActiveDoctorId,
  isTreatingDoctor,
  type Actor,
} from "./access-policy";
import { ServiceError } from "./service-error";

function assertDoctor(actor: Actor) {
  if (actor.role !== "doctor") throw new ServiceError("Forbidden.", 403, "FORBIDDEN");
}

export async function getDoctorVisit(input: {
  queueEntryId: string;
  actor: Actor;
}): Promise<DoctorVisitReview> {
  assertDoctor(input.actor);
  if (!doctorVisitParamsSchema.safeParse({ queueEntryId: input.queueEntryId }).success) {
    throw new ServiceError("Invalid queue entry identifier.", 400, "INVALID_ID");
  }
  await assertActiveActor(input.actor);
  const [reference] = await db
    .select({ encounterId: encounter.id, appointmentId: appointment.id })
    .from(queueEntry)
    .innerJoin(appointment, eq(queueEntry.appointmentId, appointment.id))
    .innerJoin(encounter, eq(encounter.appointmentId, appointment.id))
    .where(eq(queueEntry.id, input.queueEntryId))
    .limit(1);
  if (
    !reference ||
    !(await isTreatingDoctor(input.actor.userId, reference.appointmentId))
  ) {
    throw new ServiceError("Visit not found.", 404, "NOT_FOUND");
  }
  const [intake] = await db
    .select({ content: preliminaryNote.content, createdAt: preliminaryNote.createdAt })
    .from(preliminaryNote)
    .where(eq(preliminaryNote.encounterId, reference.encounterId))
    .orderBy(asc(preliminaryNote.createdAt))
    .limit(1);
  const [recordedVitals] = await db
    .select()
    .from(vitals)
    .where(eq(vitals.encounterId, reference.encounterId))
    .orderBy(asc(vitals.recordedAt))
    .limit(1);
  const notes = await db
    .select({
      id: clinicalNote.id,
      content: clinicalNote.content,
      createdAt: clinicalNote.createdAt,
    })
    .from(clinicalNote)
    .where(eq(clinicalNote.encounterId, reference.encounterId))
    .orderBy(asc(clinicalNote.createdAt), asc(clinicalNote.id));
  return {
    encounterId: reference.encounterId,
    queueEntryId: input.queueEntryId,
    intake: intake && {
      content: intake.content,
      createdAt: intake.createdAt.toISOString(),
    },
    vitals: recordedVitals
      ? {
          bpSystolic: recordedVitals.bpSystolic,
          bpDiastolic: recordedVitals.bpDiastolic,
          heartRate: recordedVitals.heartRate,
          respiratoryRate: recordedVitals.respiratoryRate,
          temperatureC: recordedVitals.temperatureC,
          spo2: recordedVitals.spo2,
          weightKg: recordedVitals.weightKg,
          heightCm: recordedVitals.heightCm,
          additional: recordedVitals.additional,
          recordedAt: recordedVitals.recordedAt.toISOString(),
        }
      : null,
    notes: notes.map((note) => ({ ...note, createdAt: note.createdAt.toISOString() })),
  };
}

const PATIENTS_PAGE_SIZE = 25;
const patientSummary = {
  id: patient.id,
  fullName: patient.fullName,
  patientNo: patient.patientNo,
};

export async function listDoctorPatients(input: {
  actor: Actor;
  search: string;
  page: number;
}) {
  assertDoctor(input.actor);
  const doctorId = await getActiveDoctorId(input.actor);
  if (!doctorId)
    throw new ServiceError("Doctor profile is unavailable.", 404, "NOT_FOUND");
  const pattern = `%${input.search.replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await db
    .select(patientSummary)
    .from(patient)
    .where(
      and(
        doctorCareRelationship(doctorId),
        input.search
          ? or(ilike(patient.fullName, pattern), ilike(patient.patientNo, pattern))
          : undefined
      )
    )
    .orderBy(asc(patient.fullName), asc(patient.id))
    .limit(PATIENTS_PAGE_SIZE + 1)
    .offset((input.page - 1) * PATIENTS_PAGE_SIZE);

  return {
    patients: rows.slice(0, PATIENTS_PAGE_SIZE),
    hasMore: rows.length > PATIENTS_PAGE_SIZE,
  };
}

export async function getPatientHistory(input: {
  patientId: string;
  actor: Actor;
}): Promise<PatientHistory> {
  assertDoctor(input.actor);
  if (
    !doctorPatientHistoryParamsSchema.safeParse({ patientId: input.patientId }).success
  ) {
    throw new ServiceError("Invalid patient identifier.", 400, "INVALID_ID");
  }
  const doctorId = await getActiveDoctorId(input.actor);
  if (!doctorId) throw new ServiceError("Patient history not found.", 404, "NOT_FOUND");
  const [record] = await db
    .select(patientSummary)
    .from(patient)
    .where(and(eq(patient.id, input.patientId), doctorCareRelationship(doctorId)))
    .limit(1);
  if (!record) throw new ServiceError("Patient history not found.", 404, "NOT_FOUND");
  const visits = await db
    .select({
      id: encounter.id,
      startedAt: encounter.startedAt,
      endedAt: encounter.endedAt,
    })
    .from(encounter)
    .where(
      and(eq(encounter.patientId, input.patientId), eq(encounter.status, "completed"))
    )
    .orderBy(desc(encounter.startedAt), desc(encounter.id));
  const encounters = await Promise.all(
    visits.map(async (visit) => {
      const [notes, prescriptions, [recordedVitals]] = await Promise.all([
        db
          .select({
            id: clinicalNote.id,
            content: clinicalNote.content,
            createdAt: clinicalNote.createdAt,
          })
          .from(clinicalNote)
          .where(eq(clinicalNote.encounterId, visit.id))
          .orderBy(asc(clinicalNote.createdAt), asc(clinicalNote.id)),
        db
          .select({
            id: prescription.id,
            createdAt: prescription.createdAt,
            status: prescription.status,
          })
          .from(prescription)
          .where(eq(prescription.encounterId, visit.id))
          .orderBy(asc(prescription.createdAt), asc(prescription.id)),
        db
          .select({
            bpSystolic: vitals.bpSystolic,
            bpDiastolic: vitals.bpDiastolic,
            heartRate: vitals.heartRate,
            spo2: vitals.spo2,
            temperatureC: vitals.temperatureC,
            recordedAt: vitals.recordedAt,
          })
          .from(vitals)
          .where(eq(vitals.encounterId, visit.id))
          .orderBy(desc(vitals.recordedAt), desc(vitals.id))
          .limit(1),
      ]);
      const items = prescriptions.length
        ? await db
            .select({
              id: prescriptionItem.id,
              prescriptionId: prescriptionItem.prescriptionId,
              name: sql<string>`coalesce(${prescriptionItem.medicineName}, ${medicine.name})`,
              strength: medicine.strength,
              dosage: prescriptionItem.dosage,
              frequency: prescriptionItem.frequency,
            })
            .from(prescriptionItem)
            .leftJoin(medicine, eq(prescriptionItem.medicineId, medicine.id))
            .where(
              inArray(
                prescriptionItem.prescriptionId,
                prescriptions.map(({ id }) => id)
              )
            )
            .orderBy(asc(prescriptionItem.id))
        : [];
      return {
        id: visit.id,
        startedAt: visit.startedAt.toISOString(),
        endedAt: visit.endedAt?.toISOString() ?? null,
        notes: notes.map((note) => ({
          ...note,
          createdAt: note.createdAt.toISOString(),
        })),
        vitals: recordedVitals
          ? { ...recordedVitals, recordedAt: recordedVitals.recordedAt.toISOString() }
          : null,
        prescriptions: prescriptions.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          items: items
            .filter(({ prescriptionId }) => prescriptionId === item.id)
            .map(({ id, name, strength, dosage, frequency }) => ({
              id,
              name,
              strength,
              dosage,
              frequency,
            })),
        })),
      };
    })
  );
  return { patientId: input.patientId, patient: record, encounters };
}
