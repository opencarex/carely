import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { DbExecutor } from "@/lib/db/types";
import { user } from "@/lib/db/schema/auth";
import { patient } from "@/lib/db/schema/patient";
import { doctor } from "@/lib/db/schema/doctor";
import { appointment } from "@/lib/db/schema/appointment";
import { queueEntry } from "@/lib/db/schema/queue-entry";
import { encounter } from "@/lib/db/schema/encounter";
import { colomboNow } from "@/lib/clinic-time";

// Explicit executor required: importing factories never connects to an app database.
export async function createUser(
  executor: DbExecutor,
  overrides: Partial<typeof user.$inferInsert> = {}
) {
  const id = randomUUID();
  const [row] = await executor
    .insert(user)
    .values({
      id,
      name: "Test User",
      email: id + "@test.invalid",
      role: "patient",
      emailVerified: true,
      ...overrides,
    })
    .returning();
  return row;
}
export async function createPatient(
  executor: DbExecutor,
  overrides: Partial<typeof patient.$inferInsert> = {}
) {
  const [row] = await executor
    .insert(patient)
    .values({
      fullName: "Test Patient",
      patientNo: "PAT-TEST-" + randomUUID(),
      ...overrides,
    })
    .returning();
  return row;
}
export async function createDoctor(
  executor: DbExecutor,
  overrides: Partial<typeof doctor.$inferInsert> = {}
) {
  const userId = overrides.userId ?? (await createUser(executor, { role: "doctor" })).id;
  const [row] = await executor
    .insert(doctor)
    .values({ userId, ...overrides })
    .returning();
  return row;
}
export async function createAppointment(
  executor: DbExecutor,
  overrides: Partial<typeof appointment.$inferInsert> = {}
) {
  const patientId = overrides.patientId ?? (await createPatient(executor)).id;
  const doctorId = overrides.doctorId ?? (await createDoctor(executor)).id;
  const [row] = await executor
    .insert(appointment)
    .values({
      patientId,
      doctorId,
      appointmentDate: colomboNow().date,
      appointmentNo: 1,
      ...overrides,
    })
    .returning();
  return row;
}
export async function createQueueEntry(
  executor: DbExecutor,
  overrides: Partial<typeof queueEntry.$inferInsert> = {}
) {
  const appointmentId = overrides.appointmentId ?? (await createAppointment(executor)).id;
  const [row] = await executor
    .insert(queueEntry)
    .values({ appointmentId, ...overrides })
    .returning();
  return row;
}
export async function createQueuedVisit(executor: DbExecutor) {
  const patientUser = await createUser(executor);
  const doctorUser = await createUser(executor, { role: "doctor" });
  const patientRow = await createPatient(executor, { userId: patientUser.id });
  const doctorRow = await createDoctor(executor, { userId: doctorUser.id });
  const booking = await createAppointment(executor, {
    patientId: patientRow.id,
    doctorId: doctorRow.id,
  });
  const entry = await createQueueEntry(executor, { appointmentId: booking.id });
  return {
    patientUser,
    doctorUser,
    patient: patientRow,
    doctor: doctorRow,
    appointment: booking,
    queue: entry,
  };
}
export async function createEncounter(
  executor: DbExecutor,
  overrides: Partial<typeof encounter.$inferInsert> = {}
) {
  const [existing] = overrides.appointmentId
    ? await executor
        .select()
        .from(appointment)
        .where(eq(appointment.id, overrides.appointmentId))
        .limit(1)
    : [];
  const booking =
    existing ??
    (overrides.appointmentId
      ? undefined
      : await createAppointment(executor, {
          ...(overrides.patientId ? { patientId: overrides.patientId } : {}),
          ...(overrides.doctorId ? { doctorId: overrides.doctorId } : {}),
        }));
  if (!booking) throw new Error("Appointment not found for test encounter.");
  if (
    (overrides.patientId && overrides.patientId !== booking.patientId) ||
    (overrides.doctorId && overrides.doctorId !== booking.doctorId)
  ) {
    throw new Error("Encounter fixture must match its appointment's patient and doctor.");
  }
  const [row] = await executor
    .insert(encounter)
    .values({
      ...overrides,
      appointmentId: booking.id,
      patientId: booking.patientId,
      doctorId: booking.doctorId,
    })
    .returning();
  return row;
}
