import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { specialty } from "./specialty";

export const visitReason = pgTable("visit_reason", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  specialtyId: uuid("specialty_id")
    .notNull()
    .references(() => specialty.id, { onDelete: "restrict" }),
  isActive: boolean("is_active").default(true).notNull(),
});
