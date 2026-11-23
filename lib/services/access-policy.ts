import { and, eq, exists, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import type { DbExecutor } from "@/lib/db/types";
import { user } from "@/lib/db/schema/auth";
import { patient } from "@/lib/db/schema/patient";
import { doctor } from "@/lib/db/schema/doctor";
import { appointment } from "@/lib/db/schema/appointment";
import { encounter } from "@/lib/db/schema/encounter";
import { queueEntry } from "@/lib/db/schema/queue-entry";
import { prescription } from "@/lib/db/schema/prescription";
import { colomboNow } from "@/lib/clinic-time";
import { ServiceError } from "./service-error";

// Construct from the server session; never accept an actor from a request body.
export type Actor = { userId: string; role: string };

export async function isActiveActor(actor: Actor, executor: DbExecutor = db) {
  if (!actor?.userId || !actor.role) return false;
  const [record] = await executor
    .select({ role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, actor.userId))
    .limit(1);
  return !!record && !record.banned && record.role === actor.role;
}

export async function assertActiveActor(actor: Actor, executor: DbExecutor = db) {
  if (!(await isActiveActor(actor, executor))) {
    throw new ServiceError("Your account is unavailable.", 403, "ACCOUNT_UNAVAILABLE");
  }
}

export async function isTreatingDoctor(
  actorUserId: string,
  appointmentId: string,
  executor: DbExecutor = db
): Promise<boolean> {
  const [row] = await executor
    .select({ id: appointment.id })
    .from(appointment)
    .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
    .innerJoin(user, eq(doctor.userId, user.id))
    .where(
      and(
        eq(appointment.id, appointmentId),
        ne(appointment.status, "cancelled"),
        eq(user.id, actorUserId),
        eq(user.role, "doctor"),
        eq(doctor.isActive, true)
      )
    )
    .limit(1);
  if (!row) return false;
  return isActiveActor({ userId: actorUserId, role: "doctor" }, executor);
}

export async function getActiveDoctorId(actor: Actor, executor: DbExecutor = db) {
  if (actor.role !== "doctor" || !(await isActiveActor(actor, executor)))
    return undefined;
  const [profile] = await executor
    .select({ id: doctor.id })
    .from(doctor)
    .where(and(eq(doctor.userId, actor.userId), eq(doctor.isActive, true)))
    .limit(1);
  return profile?.id;
}

export function doctorCareRelationship(doctorId: string, executor: DbExecutor = db) {
  const booking = executor
    .select({ id: appointment.id })
    .from(appointment)
    .where(
      and(
        eq(appointment.patientId, patient.id),
        eq(appointment.doctorId, doctorId),
        ne(appointment.status, "cancelled")
      )
    );
  const visit = executor
    .select({ id: encounter.id })
    .from(encounter)
    .where(and(eq(encounter.patientId, patient.id), eq(encounter.doctorId, doctorId)));
  return or(exists(booking), exists(visit));
}

export async function canViewClinical(
  actor: Actor,
  patientId: string,
  executor: DbExecutor = db
): Promise<boolean> {
  const doctorId = await getActiveDoctorId(actor, executor);
  if (!doctorId) return false;
  const [record] = await executor
    .select({ id: patient.id })
    .from(patient)
    .where(and(eq(patient.id, patientId), doctorCareRelationship(doctorId, executor)))
    .limit(1);
  return !!record;
}

export async function canViewPatientAdmin(
  actor: Actor,
  patientId: string,
  executor: DbExecutor = db
): Promise<boolean> {
  if (!(await isActiveActor(actor, executor))) return false;
  const [record] = await executor
    .select({ userId: patient.userId })
    .from(patient)
    .where(eq(patient.id, patientId))
    .limit(1);
  if (!record) return false;
  if (actor.role === "patient") return record.userId === actor.userId;
  if (actor.role === "receptionist") return true;
  if (actor.role === "doctor") return canViewClinical(actor, patientId, executor);
  if (actor.role === "nurse") {
    const [entry] = await executor
      .select({ id: queueEntry.id })
      .from(queueEntry)
      .innerJoin(appointment, eq(queueEntry.appointmentId, appointment.id))
      .where(
        and(
          eq(appointment.patientId, patientId),
          eq(appointment.appointmentDate, colomboNow().date),
          eq(appointment.status, "booked"),
          eq(queueEntry.status, "waiting")
        )
      )
      .limit(1);
    return !!entry;
  }
  return false; // Admin has no clinical/patient access; pharmacists use prescription policy.
}

export async function canViewPrescription(
  actor: Actor,
  prescriptionId: string,
  executor: DbExecutor = db
): Promise<boolean> {
  if (!(await isActiveActor(actor, executor))) return false;
  const [record] = await executor
    .select({
      patientId: encounter.patientId,
      patientUserId: patient.userId,
    })
    .from(prescription)
    .innerJoin(encounter, eq(prescription.encounterId, encounter.id))
    .innerJoin(patient, eq(encounter.patientId, patient.id))
    .where(eq(prescription.id, prescriptionId))
    .limit(1);
  if (!record) return false;
  if (actor.role === "pharmacist") return true;
  if (actor.role === "patient") return record.patientUserId === actor.userId;
  return actor.role === "doctor" && canViewClinical(actor, record.patientId, executor);
}
