import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { encounter } from "./encounter";

export const preliminaryNote = pgTable(
  "preliminary_note",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounter.id, { onDelete: "restrict" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("preliminary_note_encounter_idx").on(t.encounterId, t.createdAt)]
);
