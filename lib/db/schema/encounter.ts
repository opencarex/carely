import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { appointment } from "./appointment";
import { doctor } from "./doctor";
import { patient } from "./patient";

export const encounter = pgTable(
  "encounter",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "restrict" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctor.id, { onDelete: "restrict" }),
    appointmentId: uuid("appointment_id")
      .notNull()
      .unique()
      .references(() => appointment.id, { onDelete: "restrict" }),
    status: text("status")
      .$type<"in_progress" | "completed">()
      .default("in_progress")
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [
    check("encounter_status_check", sql`${t.status} in ('in_progress', 'completed')`),
    check(
      "encounter_completion_check",
      sql`(${t.status} = 'completed') = (${t.endedAt} is not null)`
    ),
    index("encounter_patient_history_idx").on(t.patientId, t.startedAt),
    index("encounter_doctor_idx").on(t.doctorId),
  ]
);
export type Encounter = typeof encounter.$inferSelect;
