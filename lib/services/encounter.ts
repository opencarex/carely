import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import type { DbTransaction } from "@/lib/db/types";
import { encounter } from "@/lib/db/schema/encounter";
import { appointment } from "@/lib/db/schema/appointment";
import { queueEntry } from "@/lib/db/schema/queue-entry";
import { colomboNow } from "@/lib/clinic-time";
import { encounterActions } from "@/lib/audit/actions/encounter";
import { assertActiveActor, isTreatingDoctor, type Actor } from "./access-policy";
import { recordAudit } from "./audit";
import { ServiceError } from "./service-error";

function validateId(id: string) {
  if (!z.uuid().safeParse(id).success) {
    throw new ServiceError("Invalid record identifier.", 400, "INVALID_ID");
  }
}

/** Trusted callers pass the server actor. Check-in must insert its queue row first.
 * Lock order: appointment -> encounter -> queue row. Reuse tx for compound actions.
 */
export async function getOrCreateEncounter(
  appointmentId: string,
  actor: Actor,
  tx?: DbTransaction
) {
  validateId(appointmentId);
  const run = async (transaction: DbTransaction) => {
    await assertActiveActor(actor, transaction);
    if (!["receptionist", "nurse", "doctor"].includes(actor.role)) {
      throw new ServiceError("This role cannot create encounters.", 403, "FORBIDDEN");
    }
    const [booking] = await transaction
      .select()
      .from(appointment)
      .where(eq(appointment.id, appointmentId))
      .for("update");
    if (
      !booking ||
      (actor.role === "doctor" &&
        !(await isTreatingDoctor(actor.userId, appointmentId, transaction)))
    ) {
      throw new ServiceError("Appointment not found.", 404, "NOT_FOUND");
    }
    // Idempotent retries may retrieve completed visits but must not write to them.
    const [existing] = await transaction
      .select()
      .from(encounter)
      .where(eq(encounter.appointmentId, appointmentId))
      .for("update");
    if (existing) return existing;
    if (booking.status !== "booked" || booking.appointmentDate !== colomboNow().date) {
      throw new ServiceError(
        "Only today's booked appointments can start an encounter.",
        409,
        "APPOINTMENT_CLOSED"
      );
    }
    const [entry] = await transaction
      .select({ status: queueEntry.status })
      .from(queueEntry)
      .where(eq(queueEntry.appointmentId, appointmentId));
    if (!entry || entry.status !== "waiting") {
      throw new ServiceError(
        "Check in the appointment before creating its encounter.",
        409,
        "CHECK_IN_REQUIRED"
      );
    }
    const [created] = await transaction
      .insert(encounter)
      .values({
        appointmentId,
        patientId: booking.patientId,
        doctorId: booking.doctorId,
      })
      .returning();
    await recordAudit(transaction, {
      actorId: actor.userId,
      action: encounterActions.created,
      targetType: "encounter",
      targetId: created.id,
    });
    return created;
  };
  return tx ? run(tx) : db.transaction(run);
}

/** REQUIRED inside every intake/note/prescription/completion transaction.
 * Holds the encounter lock until the caller commits. Completion takes the same lock,
 * then transitions the queue in that transaction, so a concurrent write cannot slip in.
 */
export async function assertEncounterWritable(
  encounterId: string,
  actor: Actor,
  tx: DbTransaction
) {
  validateId(encounterId);
  await assertActiveActor(actor, tx);
  if (!["nurse", "doctor"].includes(actor.role)) {
    throw new ServiceError("This role cannot write clinical records.", 403, "FORBIDDEN");
  }
  // Resolve the parent first, then obey the shared appointment -> encounter lock order.
  const [reference] = await tx
    .select({ appointmentId: encounter.appointmentId })
    .from(encounter)
    .where(eq(encounter.id, encounterId))
    .limit(1);
  if (!reference) throw new ServiceError("Encounter not found.", 404, "NOT_FOUND");
  await tx
    .select({ id: appointment.id })
    .from(appointment)
    .where(eq(appointment.id, reference.appointmentId))
    .for("update");
  const [visit] = await tx
    .select()
    .from(encounter)
    .where(eq(encounter.id, encounterId))
    .for("update");
  if (
    !visit ||
    (actor.role === "doctor" &&
      !(await isTreatingDoctor(actor.userId, visit.appointmentId, tx)))
  ) {
    throw new ServiceError("Encounter not found.", 404, "NOT_FOUND");
  }
  if (visit.status === "completed" || visit.endedAt !== null) {
    throw new ServiceError("The encounter is completed.", 409, "ENCOUNTER_COMPLETED");
  }
  const [booking] = await tx
    .select({ id: appointment.id })
    .from(appointment)
    .where(
      and(
        eq(appointment.id, visit.appointmentId),
        eq(appointment.status, "booked"),
        eq(appointment.appointmentDate, colomboNow().date)
      )
    );
  const [entry] = await tx
    .select({ status: queueEntry.status })
    .from(queueEntry)
    .where(eq(queueEntry.appointmentId, visit.appointmentId));
  const expected = actor.role === "nurse" ? "waiting" : "with_doctor";
  if (!booking || entry?.status !== expected) {
    throw new ServiceError(
      "The visit is not in a writable workflow state.",
      409,
      "INVALID_WORKFLOW_STATE"
    );
  }
  return visit;
}
