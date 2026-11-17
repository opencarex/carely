import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { prescription } from "./prescription";

// Many records per prescription are permitted by the ERD. The dispensing
// service must lock prescription and check status to enforce a single dispense.
export const dispenseRecord = pgTable("dispense_record", {
  id: uuid("id").defaultRandom().primaryKey(),
  prescriptionId: uuid("prescription_id")
    .notNull()
    .references(() => prescription.id, { onDelete: "restrict" }),
  dispensedBy: text("dispensed_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  dispensedAt: timestamp("dispensed_at", { withTimezone: true }).defaultNow().notNull(),
});
