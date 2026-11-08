import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { doctor } from "./doctor";
import { encounter } from "./encounter";
export const prescription = pgTable(
  "prescription",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounter.id, { onDelete: "restrict" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctor.id, { onDelete: "restrict" }),
    status: text("status").default("issued").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("prescription_encounter_idx").on(t.encounterId, t.createdAt)]
);
