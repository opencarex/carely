import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { account, session, user } from "@/lib/db/schema/auth";
import { doctor } from "@/lib/db/schema/doctor";
import { queueEntry } from "@/lib/db/schema/queue-entry";
import { encounter } from "@/lib/db/schema/encounter";
import { clinicalNote } from "@/lib/db/schema/clinical-note";
import { auditLog } from "@/lib/db/schema/audit-log";
import { medicine } from "@/lib/db/schema/medicine";
import { prescription } from "@/lib/db/schema/prescription";
import { prescriptionItem } from "@/lib/db/schema/prescription-item";
import {
  createUser,
  createQueuedVisit,
  createDoctor,
  createAppointment,
} from "../helpers/factories";
import type { Database } from "@/lib/db/types";
import type { Actor } from "@/lib/services/access-policy";

const config = vi.hoisted(() => ({
  adminUrl:
    process.env.FOUNDATION_TEST_DATABASE_URL ?? process.env.BOOKING_TEST_DATABASE_URL,
  databaseName:
    "carely_foundation_test_" + Date.now() + "_" + Math.random().toString(16).slice(2),
}));

vi.mock("@/lib/db", async () => {
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { default: postgres } = await import("postgres");
  const url = new URL(config.adminUrl!);
  url.pathname = "/" + config.databaseName;
  const conn = postgres(url.toString(), { max: 8, prepare: false });
  return { db: drizzle(conn), conn };
});
vi.mock("@/lib/auth", async () => {
  const { betterAuth } = await import("better-auth");
  const { drizzleAdapter } = await import("better-auth/adapters/drizzle");
  const { admin } = await import("better-auth/plugins");
  const { db } = await import("@/lib/db");
  const schema = await import("@/lib/db/schema/auth");
  return {
    auth: betterAuth({
      baseURL: "http://localhost:3000",
      secret: "foundation-tests-only-secret-at-least-32-characters",
      database: drizzleAdapter(db, { provider: "pg", schema }),
      emailAndPassword: { enabled: true },
      plugins: [admin({ defaultRole: "patient", adminRoles: ["admin"] })],
    }),
  };
});

describe.skipIf(!config.adminUrl)("Sprint recovery foundation (PostgreSQL)", () => {
  let admin: postgres.Sql;
  let connection: postgres.Sql;
  let database: Database;
  let encounters: typeof import("@/lib/services/encounter");
  let policies: typeof import("@/lib/services/access-policy");
  let audit: typeof import("@/lib/services/audit");
  let staff: typeof import("@/lib/services/staff");

  beforeAll(async () => {
    admin = postgres(config.adminUrl!, { max: 1, connect_timeout: 5 });
    await admin`create database ${admin(config.databaseName)}`;
    const databaseModule = await import("@/lib/db");
    connection = databaseModule.conn;
    database = databaseModule.db;
    await migrate(database, { migrationsFolder: "./drizzle" });
    encounters = await import("@/lib/services/encounter");
    policies = await import("@/lib/services/access-policy");
    audit = await import("@/lib/services/audit");
    staff = await import("@/lib/services/staff");
  }, 30_000);

  afterAll(async () => {
    await connection?.end();
    if (admin) {
      await admin`drop database if exists ${admin(config.databaseName)}`;
      await admin.end();
    }
  });

  it("creates one encounter and one audit event under concurrent retries", async () => {
    const visit = await createQueuedVisit(database);
    const nurse = await createUser(database, { role: "nurse" });
    const actor = { userId: nurse.id, role: nurse.role };
    const results = await Promise.all([
      encounters.getOrCreateEncounter(visit.appointment.id, actor),
      encounters.getOrCreateEncounter(visit.appointment.id, actor),
    ]);
    expect(results[0].id).toBe(results[1].id);
    const rows = await database
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, results[0].id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: "encounter.created",
      userId: nurse.id,
      metadata: {},
    });
    await expect(
      database.insert(queueEntry).values({ appointmentId: visit.appointment.id })
    ).rejects.toThrow();
  });

  it("rolls back the encounter and audit together when the surrounding action fails", async () => {
    const visit = await createQueuedVisit(database);
    const nurse = await createUser(database, { role: "nurse" });
    let encounterId = "";
    await expect(
      database.transaction(async (tx) => {
        const created = await encounters.getOrCreateEncounter(
          visit.appointment.id,
          { userId: nurse.id, role: nurse.role },
          tx
        );
        encounterId = created.id;
        throw new Error("simulate domain failure");
      })
    ).rejects.toThrow("simulate domain failure");
    expect(
      await database
        .select()
        .from(encounter)
        .where(eq(encounter.appointmentId, visit.appointment.id))
    ).toHaveLength(0);
    expect(
      await database.select().from(auditLog).where(eq(auditLog.entityId, encounterId))
    ).toHaveLength(0);
  });

  it("rejects a future appointment, missing check-in, and an unauthorized doctor", async () => {
    const visit = await createQueuedVisit(database);
    const nurse = await createUser(database, { role: "nurse" });
    const actor = { userId: nurse.id, role: nurse.role };
    const future = await createAppointment(database, { appointmentDate: "2099-01-01" });
    await expect(encounters.getOrCreateEncounter(future.id, actor)).rejects.toMatchObject(
      { statusCode: 409 }
    );
    const unchecked = await createAppointment(database);
    await expect(
      encounters.getOrCreateEncounter(unchecked.id, actor)
    ).rejects.toMatchObject({ code: "CHECK_IN_REQUIRED" });
    const stranger = await createUser(database, { role: "doctor" });
    await createDoctor(database, { userId: stranger.id });
    await expect(
      encounters.getOrCreateEncounter(visit.appointment.id, {
        userId: stranger.id,
        role: stranger.role,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("separates administrative, intake, clinical, and prescription access", async () => {
    const visit = await createQueuedVisit(database);
    const actors: Record<string, Actor> = {};
    for (const role of ["admin", "nurse", "receptionist", "pharmacist"]) {
      const row = await createUser(database, { role });
      actors[role] = { userId: row.id, role };
    }
    const self = { userId: visit.patientUser.id, role: "patient" };
    const treating = { userId: visit.doctorUser.id, role: "doctor" };
    const stranger = await createUser(database, { role: "doctor" });
    await createDoctor(database, { userId: stranger.id });
    expect(await policies.canViewPatientAdmin(self, visit.patient.id)).toBe(true);
    expect(
      await policies.canViewPatientAdmin(actors.receptionist, visit.patient.id)
    ).toBe(true);
    expect(await policies.canViewPatientAdmin(actors.nurse, visit.patient.id)).toBe(true);
    expect(await policies.canViewClinical(treating, visit.patient.id)).toBe(true);
    for (const actor of [
      actors.admin,
      actors.receptionist,
      actors.nurse,
      actors.pharmacist,
      self,
      { userId: stranger.id, role: "doctor" },
    ]) {
      expect(await policies.canViewClinical(actor, visit.patient.id)).toBe(false);
    }
    const row = await encounters.getOrCreateEncounter(visit.appointment.id, actors.nurse);
    const [rx] = await database
      .insert(prescription)
      .values({ encounterId: row.id, doctorId: visit.doctor.id })
      .returning();
    expect(await policies.canViewPrescription(self, rx.id)).toBe(true);
    expect(await policies.canViewPrescription(actors.pharmacist, rx.id)).toBe(true);
    expect(await policies.canViewPrescription(actors.receptionist, rx.id)).toBe(false);
    await database
      .update(user)
      .set({ banned: true })
      .where(eq(user.id, actors.receptionist.userId));
    expect(
      await policies.canViewPatientAdmin(actors.receptionist, visit.patient.id)
    ).toBe(false);
    expect(
      await policies.canViewPatientAdmin({ ...self, role: "admin" }, visit.patient.id)
    ).toBe(false);
  });

  it("requires the correct queue phase and prevents writes after completion", async () => {
    const visit = await createQueuedVisit(database);
    const nurse = await createUser(database, { role: "nurse" });
    const nurseActor = { userId: nurse.id, role: nurse.role };
    const actor = { userId: visit.doctorUser.id, role: "doctor" };
    const row = await encounters.getOrCreateEncounter(visit.appointment.id, nurseActor);
    await database.transaction((tx) =>
      encounters.assertEncounterWritable(row.id, nurseActor, tx)
    );
    await expect(
      database.transaction((tx) => encounters.assertEncounterWritable(row.id, actor, tx))
    ).rejects.toMatchObject({ code: "INVALID_WORKFLOW_STATE" });
    await database
      .update(queueEntry)
      .set({ status: "with_doctor" })
      .where(eq(queueEntry.id, visit.queue.id));
    let signalLocked!: () => void;
    let release!: () => void;
    const locked = new Promise<void>((resolve) => {
      signalLocked = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const completion = database.transaction(async (tx) => {
      await encounters.assertEncounterWritable(row.id, actor, tx);
      signalLocked();
      await released;
      await tx
        .update(encounter)
        .set({ status: "completed", endedAt: new Date() })
        .where(eq(encounter.id, row.id));
      await tx
        .update(queueEntry)
        .set({ status: "completed" })
        .where(eq(queueEntry.id, visit.queue.id));
    });
    await locked;
    const lateWrite = database.transaction(async (tx) => {
      await encounters.assertEncounterWritable(row.id, actor, tx);
      await tx.insert(clinicalNote).values({
        encounterId: row.id,
        authorId: actor.userId,
        content: "must not save",
      });
    });
    // Attach the rejection handler before allowing the completion to commit.
    const rejection = expect(lateWrite).rejects.toMatchObject({
      code: "ENCOUNTER_COMPLETED",
    });
    release();
    await completion;
    await rejection;
    expect(
      await database
        .select()
        .from(clinicalNote)
        .where(eq(clinicalNote.encounterId, row.id))
    ).toHaveLength(0);
  });

  it("makes audit rows immutable and preserves known actors", async () => {
    const actor = await createUser(database, { role: "admin" });
    const row = await database.transaction((tx) =>
      audit.recordAudit(tx, {
        actorId: actor.id,
        action: "staff.updated",
        targetType: "user",
        targetId: actor.id,
        metadata: { changedFields: ["name"] },
      })
    );
    await expect(
      database
        .update(auditLog)
        .set({ action: "staff.created" })
        .where(eq(auditLog.id, row.id))
    ).rejects.toThrow();
    await expect(
      database.delete(auditLog).where(eq(auditLog.id, row.id))
    ).rejects.toThrow();
    await expect(database.execute(sql`truncate audit_log`)).rejects.toThrow();
    await expect(database.delete(user).where(eq(user.id, actor.id))).rejects.toThrow();
  });

  it("revokes existing sessions, blocks sign-in, and allows reactivation", async () => {
    const { hashPassword } = await import("better-auth/crypto");
    const { auth } = await import("@/lib/auth");
    const adminUser = await createUser(database, { role: "admin" });
    const target = await createUser(database, { role: "doctor" });
    await createDoctor(database, { userId: target.id });
    const password = "Foundation-test-password-123!";
    await database.insert(account).values({
      id: randomUUID(),
      userId: target.id,
      accountId: target.id,
      providerId: "credential",
      password: await hashPassword(password),
    });
    const response = await auth.api.signInEmail({
      body: { email: target.email, password },
      asResponse: true,
    });
    expect(response.status).toBe(200);
    const cookies = response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
    const headers = new Headers({ cookie: cookies });
    expect((await auth.api.getSession({ headers }))?.user.id).toBe(target.id);
    await staff.toggleStaffStatus(target.id, false, {
      userId: adminUser.id,
      role: "admin",
    });
    expect(await auth.api.getSession({ headers })).toBeNull();
    expect(
      await database.select().from(session).where(eq(session.userId, target.id))
    ).toHaveLength(0);
    const [profile] = await database
      .select()
      .from(doctor)
      .where(eq(doctor.userId, target.id));
    expect(profile.isActive).toBe(false);
    await expect(
      auth.api.signInEmail({ body: { email: target.email, password } })
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
    await staff.toggleStaffStatus(target.id, true, {
      userId: adminUser.id,
      role: "admin",
    });
    await expect(
      auth.api.signInEmail({ body: { email: target.email, password } })
    ).resolves.toBeDefined();
    const events = await database
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityId, target.id), eq(auditLog.entityType, "user")));
    expect(events.map((event) => event.action)).toEqual(
      expect.arrayContaining(["staff.deactivated", "staff.reactivated"])
    );
    await expect(
      staff.toggleStaffStatus(adminUser.id, false, {
        userId: adminUser.id,
        role: "admin",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    const patient = await createUser(database);
    await expect(
      staff.toggleStaffStatus(patient.id, false, { userId: adminUser.id, role: "admin" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("requires real medicine references and retains clinical authorship", async () => {
    const visit = await createQueuedVisit(database);
    const nurse = await createUser(database, { role: "nurse" });
    const row = await encounters.getOrCreateEncounter(visit.appointment.id, {
      userId: nurse.id,
      role: "nurse",
    });
    const [rx] = await database
      .insert(prescription)
      .values({ encounterId: row.id, doctorId: visit.doctor.id })
      .returning();
    const item = {
      prescriptionId: rx.id,
      medicineId: randomUUID(),
      dosage: "test",
      frequency: "test",
      durationDays: 1,
      quantity: 1,
    };
    await expect(database.insert(prescriptionItem).values(item)).rejects.toThrow();
    const [drug] = await database
      .insert(medicine)
      .values({ name: "Test medicine", form: "test", strength: "test" })
      .returning();
    await database.insert(prescriptionItem).values({ ...item, medicineId: drug.id });
    await database.insert(clinicalNote).values({
      encounterId: row.id,
      authorId: visit.doctorUser.id,
      content: "Test note",
    });
    await expect(
      database.delete(user).where(eq(user.id, visit.doctorUser.id))
    ).rejects.toThrow();
    await expect(
      database
        .insert(prescriptionItem)
        .values({ ...item, medicineId: drug.id, quantity: 0 })
    ).rejects.toThrow();
  });
});
