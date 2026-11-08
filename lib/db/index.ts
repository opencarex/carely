import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as appointmentSchema from "./schema/appointment";
import * as authSchema from "./schema/auth";
import * as availabilitySchema from "./schema/doctor-availability";
import * as doctorSchema from "./schema/doctor";
import * as patientSchema from "./schema/patient";
import * as settingsSchema from "./schema/settings";
import * as specialtySchema from "./schema/specialty";

import * as queueSchema from "./schema/queue-entry";
import * as encounterSchema from "./schema/encounter";
import * as vitalsSchema from "./schema/vitals";
import * as preliminaryNoteSchema from "./schema/preliminary-note";
import * as clinicalNoteSchema from "./schema/clinical-note";
import * as medicineSchema from "./schema/medicine";
import * as prescriptionSchema from "./schema/prescription";
import * as prescriptionItemSchema from "./schema/prescription-item";
import * as auditSchema from "./schema/audit-log";

const activeConnectionString =
  env.DATABASE_URL || "postgresql://carely_user:carely_password@localhost:5432/carely_db";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

export const conn =
  globalForDb.conn ??
  postgres(activeConnectionString, {
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, {
  schema: {
    ...authSchema,
    ...patientSchema,
    ...settingsSchema,
    ...specialtySchema,
    ...doctorSchema,
    ...availabilitySchema,
    ...appointmentSchema,
    ...queueSchema,
    ...encounterSchema,
    ...vitalsSchema,
    ...preliminaryNoteSchema,
    ...clinicalNoteSchema,
    ...medicineSchema,
    ...prescriptionSchema,
    ...prescriptionItemSchema,
    ...auditSchema,
  },
});

export {
  appointmentSchema,
  authSchema,
  availabilitySchema,
  doctorSchema,
  patientSchema,
  settingsSchema,
  specialtySchema,
  queueSchema,
  encounterSchema,
  vitalsSchema,
  preliminaryNoteSchema,
  clinicalNoteSchema,
  medicineSchema,
  prescriptionSchema,
  prescriptionItemSchema,
  auditSchema,
};
