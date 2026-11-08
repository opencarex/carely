import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DbTransaction } from "@/lib/db/types";
const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks }));
import {
  canViewClinical,
  canViewPatientAdmin,
  isActiveActor,
} from "@/lib/services/access-policy";
import { assertEncounterWritable, getOrCreateEncounter } from "@/lib/services/encounter";
import { recordAudit } from "@/lib/services/audit";

const appointmentId = "11111111-1111-4111-8111-111111111111";
const encounterId = "22222222-2222-4222-8222-222222222222";

// Promise-backed query double exercises service decisions without a database.
// Concurrency and rollback are covered separately by the opt-in PostgreSQL suite.
function transactionWith(...results: object[][]) {
  const select = vi.fn(() => {
    const promise = Promise.resolve(results.shift() ?? []);
    const chain = Object.assign(promise, {
      from: () => chain,
      where: () => chain,
      limit: () => chain,
      for: () => chain,
      innerJoin: () => chain,
    });
    return chain;
  });
  const returning = vi.fn().mockResolvedValue([{ id: "audit-id" }]);
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  return { tx: { select, insert } as unknown as DbTransaction, select, insert, values };
}
beforeEach(() => vi.resetAllMocks());

describe("Shared foundation services", () => {
  it("checks the persisted account role and ban rather than trusting a supplied actor", async () => {
    const { tx } = transactionWith(
      [{ role: "nurse", banned: false }],
      [{ role: "admin", banned: true }]
    );
    expect(await isActiveActor({ userId: "actor", role: "admin" }, tx)).toBe(false);
    expect(await isActiveActor({ userId: "actor", role: "admin" }, tx)).toBe(false);
  });
  it("denies clinical access to non-doctors and patient access to another patient's record", async () => {
    const { tx, select } = transactionWith(
      [{ role: "patient", banned: false }],
      [{ userId: "other" }]
    );
    expect(
      await canViewClinical({ userId: "actor", role: "receptionist" }, "patient", tx)
    ).toBe(false);
    expect(select).not.toHaveBeenCalled();
    expect(
      await canViewPatientAdmin({ userId: "actor", role: "patient" }, "patient", tx)
    ).toBe(false);
  });
  it("does not reopen a completed encounter and requires a transaction for clinical writes", async () => {
    const { tx } = transactionWith(
      [{ role: "nurse", banned: false }],
      [{ appointmentId }],
      [{ id: appointmentId }],
      [{ id: encounterId, appointmentId, status: "completed", endedAt: new Date() }]
    );
    await expect(
      assertEncounterWritable(encounterId, { userId: "actor", role: "nurse" }, tx)
    ).rejects.toMatchObject({ statusCode: 409, code: "ENCOUNTER_COMPLETED" });
  });
  it("rejects nonclinical actors and malformed IDs before touching encounter records", async () => {
    const { tx, select } = transactionWith([{ role: "receptionist", banned: false }]);
    await expect(
      assertEncounterWritable(encounterId, { userId: "actor", role: "receptionist" }, tx)
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(select).toHaveBeenCalledTimes(1);
    await expect(
      getOrCreateEncounter("invalid", { userId: "actor", role: "nurse" }, tx)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(select).toHaveBeenCalledTimes(1);
  });
  it("maps audit arguments to ERD columns in the supplied transaction", async () => {
    const { tx, values } = transactionWith();
    await recordAudit(tx, {
      actorId: "actor",
      action: "patient.updated",
      targetType: "patient",
      targetId: "patient-id",
      metadata: { changedFields: ["phone"] },
    });
    expect(values).toHaveBeenCalledWith({
      userId: "actor",
      action: "patient.updated",
      entityType: "patient",
      entityId: "patient-id",
      metadata: { changedFields: ["phone"] },
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects patient values before executing an audit insert", async () => {
    const { tx, insert } = transactionWith();
    await expect(
      recordAudit(tx, {
        actorId: "actor",
        action: "patient.updated",
        targetType: "patient",
        targetId: "patient-id",
        metadata: { changedFields: ["Patient Name"] } as never,
      })
    ).rejects.toThrow();
    expect(insert).not.toHaveBeenCalled();
  });
});
