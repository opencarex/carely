import {
  index,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { encounter } from "./encounter";

export const vitals = pgTable(
  "vitals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounter.id, { onDelete: "restrict" }),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    bpSystolic: smallint("bp_systolic"),
    bpDiastolic: smallint("bp_diastolic"),
    heartRate: smallint("heart_rate"),
    respiratoryRate: smallint("respiratory_rate"),
    temperatureC: numeric("temperature_c", { precision: 4, scale: 1 }),
    spo2: smallint("spo2"),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
    heightCm: numeric("height_cm", { precision: 5, scale: 1 }),
    additional:
      jsonb("additional").$type<Record<string, number | string | boolean | null>>(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("vitals_encounter_idx").on(t.encounterId)]
);
