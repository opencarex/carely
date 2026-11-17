import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { medicine } from "./medicine";

export const stockBatch = pgTable(
  "stock_batch",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicine.id, { onDelete: "restrict" }),
    batchNo: text("batch_no").notNull(),
    expiryDate: date("expiry_date", { mode: "string" }).notNull(),
    quantityOnHand: integer("quantity_on_hand").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("stock_batch_quantity_nonnegative", sql`${table.quantityOnHand} >= 0`),
  ]
);
