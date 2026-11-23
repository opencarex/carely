import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { colomboNow } from "@/lib/clinic-time";
import { db } from "@/lib/db";
import { appointment } from "@/lib/db/schema/appointment";
import { user } from "@/lib/db/schema/auth";
import { doctor } from "@/lib/db/schema/doctor";
import { patient } from "@/lib/db/schema/patient";
import { queueEntry } from "@/lib/db/schema/queue-entry";
import type {
  CreateWalkInPatientInput,
  ReceptionAppointmentSearch,
  ReceptionAppointmentSearchResponse,
  ReceptionPatientSummary,
} from "@/lib/schemas/reception";

import { assertActiveActor, type Actor } from "./access-policy";

export class ReceptionServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = "ReceptionServiceError";
  }
}

const APPOINTMENTS_PAGE_SIZE = 25;

export async function listReceptionAppointments(
  { q, page }: ReceptionAppointmentSearch,
  actor: Actor
): Promise<ReceptionAppointmentSearchResponse> {
  if (actor.role !== "receptionist") {
    throw new ReceptionServiceError(
      "Only reception staff can view today's appointments.",
      403,
      "FORBIDDEN"
    );
  }
  await assertActiveActor(actor);

  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const matches = q
    ? or(
        ilike(patient.fullName, pattern),
        ilike(patient.patientNo, pattern),
        eq(sql<string>`${appointment.id}::text`, q.toLowerCase()),
        eq(sql<string>`${patient.id}::text`, q.toLowerCase()),
        eq(sql<string>`${appointment.appointmentNo}::text`, q.replace(/^#/, ""))
      )
    : undefined;

  const rows = await db
    .select({
      id: appointment.id,
      patientName: patient.fullName,
      patientNo: patient.patientNo,
      doctorName: user.name,
      date: appointment.appointmentDate,
      appointmentNo: appointment.appointmentNo,
      status: appointment.status,
      queueStatus: queueEntry.status,
    })
    .from(appointment)
    .innerJoin(patient, eq(appointment.patientId, patient.id))
    .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
    .innerJoin(user, eq(doctor.userId, user.id))
    .leftJoin(queueEntry, eq(queueEntry.appointmentId, appointment.id))
    .where(and(eq(appointment.appointmentDate, colomboNow().date), matches))
    .orderBy(asc(user.name), asc(appointment.appointmentNo), asc(appointment.id))
    .limit(APPOINTMENTS_PAGE_SIZE + 1)
    .offset((page - 1) * APPOINTMENTS_PAGE_SIZE);

  return {
    appointments: rows.slice(0, APPOINTMENTS_PAGE_SIZE),
    hasMore: rows.length > APPOINTMENTS_PAGE_SIZE,
  };
}

function toSummary(row: typeof patient.$inferSelect): ReceptionPatientSummary {
  return {
    id: row.id,
    patientNo: row.patientNo,
    fullName: row.fullName,
    dateOfBirth: row.dateOfBirth,
    phone: row.phone,
  };
}

async function findExactDuplicates(input: CreateWalkInPatientInput) {
  if (!input.phone || !input.dateOfBirth) return [];

  const rows = await db
    .select()
    .from(patient)
    .where(
      and(
        eq(patient.phone, input.phone),
        eq(patient.dateOfBirth, input.dateOfBirth),
        sql`lower(${patient.fullName}) = lower(${input.fullName})`
      )
    )
    .orderBy(asc(patient.patientNo));

  return rows.map(toSummary);
}

export async function createWalkInPatient(input: CreateWalkInPatientInput): Promise<{
  patient?: ReceptionPatientSummary;
  duplicateCandidates: ReceptionPatientSummary[];
}> {
  const duplicateCandidates = await findExactDuplicates(input);
  if (duplicateCandidates.length > 0 && !input.confirmDuplicate) {
    return { duplicateCandidates };
  }

  const result = await db.transaction(async (tx) => {
    const sequence = await tx.execute<{ value: string }>(
      sql`select nextval('patient_no_seq')::text as value`
    );
    const patientNo = `PAT-${String(sequence[0]?.value ?? "1").padStart(6, "0")}`;
    const [created] = await tx
      .insert(patient)
      .values({
        patientNo,
        fullName: input.fullName,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        address: input.address,
        emergencyContactName: input.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone,
      })
      .returning();
    return created;
  });

  return { patient: toSummary(result), duplicateCandidates };
}

export async function searchReceptionPatients(
  query: string
): Promise<ReceptionPatientSummary[]> {
  const term = query.trim();
  const rows = await db
    .select()
    .from(patient)
    .where(
      or(
        ilike(patient.patientNo, `%${term}%`),
        ilike(patient.phone, `%${term}%`),
        ilike(patient.fullName, `%${term}%`)
      )
    )
    .orderBy(asc(patient.fullName), asc(patient.patientNo))
    .limit(25);
  return rows.map(toSummary);
}

export async function getReceptionPatientDetails(patientId: string) {
  const [record] = await db
    .select()
    .from(patient)
    .where(eq(patient.id, patientId))
    .limit(1);
  if (!record) {
    throw new ReceptionServiceError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  // This administrative view intentionally excludes appointments and clinical records.
  return {
    ...toSummary(record),
    gender: record.gender,
    address: record.address,
    emergencyContactName: record.emergencyContactName,
    emergencyContactPhone: record.emergencyContactPhone,
    hasPortalAccount: record.userId !== null,
  };
}
