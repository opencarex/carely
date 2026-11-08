import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { appointment } from "./appointment";

export const queueEntry = pgTable(
  "queue_entry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .unique()
      .references(() => appointment.id, { onDelete: "restrict" }),
    status: text("status")
      .$type<"waiting" | "intake_done" | "with_doctor" | "completed">()
      .default("waiting")
      .notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    calledAt: timestamp("called_at", { withTimezone: true }),
  },
  (t) => [
    check(
      "queue_entry_status_check",
      sql`${t.status} in ('waiting', 'intake_done', 'with_doctor', 'completed')`
    ),
    index("queue_entry_status_order_idx").on(t.status, t.checkedInAt, t.id),
  ]
);
export type QueueEntry = typeof queueEntry.$inferSelect;
