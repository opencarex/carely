import { z } from "zod";
import type { DbTransaction } from "@/lib/db/types";
import type { QueueEntry } from "@/lib/db/schema/queue-entry";
import type { Actor } from "@/lib/services/access-policy";

export const queueStatusSchema = z.enum([
  "waiting",
  "intake_done",
  "with_doctor",
  "completed",
]);
export type QueueStatus = z.infer<typeof queueStatusSchema>;
export const checkInAppointmentSchema = z.object({ appointmentId: z.uuid() }).strict();
export const transitionQueueEntrySchema = z
  .object({
    entryId: z.uuid(),
    from: queueStatusSchema,
    to: queueStatusSchema,
  })
  .strict();

// Teammate 1 implements these contracts in lib/services/queue.ts.
// Mutations supplied a transaction MUST reuse it, including their audit write.
export type CheckInAppointment = (
  input: {
    appointmentId: string;
    actor: Actor;
  },
  tx?: DbTransaction
) => Promise<QueueEntry>;
export type TransitionQueueEntry = (
  input: {
    entryId: string;
    from: QueueStatus;
    to: QueueStatus;
    actor: Actor;
  },
  tx?: DbTransaction
) => Promise<QueueEntry>;
// Deferred: the ERD has no manual sort-order column. Do not implement by changing
// checkedInAt or appointmentNo. This reserves the contract for an approved ERD change.
export type ReorderQueue = (
  input: {
    entryId: string;
    beforeEntryId: string | null;
    actor: Actor;
  },
  tx?: DbTransaction
) => Promise<QueueEntry>;

export function isAllowedQueueTransition(
  from: QueueStatus,
  to: QueueStatus,
  role: string
) {
  return (
    (from === "waiting" && to === "intake_done" && role === "nurse") ||
    (from === "intake_done" && to === "with_doctor" && role === "doctor") ||
    (from === "with_doctor" && to === "completed" && role === "doctor")
  );
}
