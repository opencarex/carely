import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
export const medicine = pgTable(
  "medicine",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    form: text("form").notNull(),
    strength: text("strength").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (t) => [index("medicine_name_idx").on(t.name)]
);
