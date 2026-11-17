import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { medicine } from "./medicine";
import { prescription } from "./prescription";
export const prescriptionItem = pgTable(
  "prescription_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prescriptionId: uuid("prescription_id")
      .notNull()
      .references(() => prescription.id, { onDelete: "restrict" }),
    medicineId: uuid("medicine_id").references(() => medicine.id, {
      onDelete: "restrict",
    }),
    medicineName: text("medicine_name"),
    dosage: text("dosage").notNull(),
    frequency: text("frequency").notNull(),
    durationDays: smallint("duration_days").notNull(),
    quantity: integer("quantity").notNull(),
    instructions: text("instructions"),
  },
  (t) => [
    check(
      "prescription_item_medicine_source_check",
      sql`(${t.medicineId} IS NOT NULL) <> (${t.medicineName} IS NOT NULL)`
    ),
    check(
      "prescription_item_positive_check",
      sql`${t.durationDays} > 0 and ${t.quantity} > 0`
    ),
    index("prescription_item_prescription_idx").on(t.prescriptionId),
  ]
);
