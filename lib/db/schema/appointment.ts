import {
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { doctor } from "./doctor";
import { patient } from "./patient";
import { visitReason } from "./visit-reason";

export const appointment = pgTable(
  "appointment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "restrict" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctor.id, { onDelete: "restrict" }),
    visitReasonId: uuid("visit_reason_id").references(() => visitReason.id, {
      onDelete: "restrict",
    }),
    appointmentDate: date("appointment_date", { mode: "string" }).notNull(),
    appointmentNo: integer("appointment_no").notNull(),
    status: text("status").default("booked").notNull(), // 'booked' | 'cancelled' | 'completed'
    source: text("source").default("online").notNull(), // 'online' | 'reception'
    bookedBy: text("booked_by").references(() => user.id, { onDelete: "set null" }),
    feeAmount: numeric("fee_amount", { precision: 10, scale: 2 }),
    paymentStatus: text("payment_status").default("unpaid"),
    paidAt: timestamp("paid_at"),
    receivedBy: text("received_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("appointment_doctor_date_no_unique").on(
      table.doctorId,
      table.appointmentDate,
      table.appointmentNo
    ),
  ]
);

export type Appointment = typeof appointment.$inferSelect;
export type NewAppointment = typeof appointment.$inferInsert;
