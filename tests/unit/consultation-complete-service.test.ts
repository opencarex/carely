import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  writable: vi.fn(),
  transition: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: { transaction: mocks.transaction } }));
vi.mock("@/lib/services/encounter", () => ({ assertEncounterWritable: mocks.writable }));
vi.mock("@/lib/services/queue", () => ({ transitionQueueEntry: mocks.transition }));

import { encounter } from "@/lib/db/schema/encounter";
import { clinicalNote } from "@/lib/db/schema/clinical-note";
import { auditLog } from "@/lib/db/schema/audit-log";
import { completeConsultation } from "@/lib/services/consultation";

const encounterId = "11111111-1111-4111-8111-111111111111";
const actor = { userId: "doctor-user", role: "doctor" };
const input = { encounterId, actor };

function prepare(
  options: { missingEntry?: boolean; missingNote?: boolean; conflict?: boolean } = {}
) {
  const rows = [
    options.missingEntry ? [] : [{ id: "queue-id" }],
    options.missingNote ? [] : [{ id: "note-id" }],
  ];
  const sources: unknown[] = [];
  const select = vi.fn(() => {
    const chain = Object.assign(Promise.resolve(rows.shift() ?? []), {
      from: (table: unknown) => {
        sources.push(table);
        return chain;
      },
      where: () => chain,
      limit: () => chain,
    });
    return chain;
  });
  const where = vi.fn((condition: SQL) => ({
    condition,
    returning: vi.fn().mockResolvedValue(options.conflict ? [] : [{ id: encounterId }]),
  }));
  const set = vi.fn((change: { status: string; endedAt: Date }) => ({ where, change }));
  const values = vi.fn(() => ({
    returning: vi.fn().mockResolvedValue([{ id: "audit-id" }]),
  }));
  const tx = {
    select,
    update: vi.fn(() => ({ set })),
    insert: vi.fn(() => ({ values })),
  };
  mocks.transaction.mockImplementation(async (run) => run(tx));
  mocks.writable.mockResolvedValue({ id: encounterId, appointmentId: "appointment-id" });
  mocks.transition.mockResolvedValue({ id: "queue-id", status: "completed" });
  return { tx, sources, set, where, values };
}

beforeEach(() => vi.resetAllMocks());

describe("Complete consultation", () => {
  it("requires the encounter lock and note before atomically updating and auditing", async () => {
    const { tx, sources, set, where, values } = prepare();
    const completed = await completeConsultation(input);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.writable).toHaveBeenCalledWith(encounterId, actor, tx);
    expect(mocks.writable.mock.invocationCallOrder[0]).toBeLessThan(
      tx.select.mock.invocationCallOrder[0]
    );
    expect(sources).toContain(clinicalNote);
    expect(tx.update).toHaveBeenCalledExactlyOnceWith(encounter);
    expect(tx.select.mock.invocationCallOrder[1]).toBeLessThan(
      tx.update.mock.invocationCallOrder[0]
    );
    expect(set).toHaveBeenCalledWith({ status: "completed", endedAt: expect.any(Date) });
    const condition = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(condition.params).toEqual([encounterId, "in_progress"]);
    expect(condition.sql).toContain('"encounter"."ended_at" is null');
    expect(mocks.transition).toHaveBeenCalledWith(
      { entryId: "queue-id", from: "with_doctor", to: "completed", actor },
      tx
    );
    expect(tx.insert).toHaveBeenCalledExactlyOnceWith(auditLog);
    expect(values).toHaveBeenCalledWith({
      userId: actor.userId,
      action: "consultation.completed",
      entityType: "encounter",
      entityId: encounterId,
      metadata: { fromStatus: "with_doctor", toStatus: "completed" },
    });
    expect(completed).toEqual({
      encounterId,
      queueEntryId: "queue-id",
      status: "completed",
      endedAt: set.mock.calls[0][0].endedAt.toISOString(),
    });
  });
  it("does not complete a consultation without a clinical note", async () => {
    const { tx } = prepare({ missingNote: true });
    await expect(completeConsultation(input)).rejects.toMatchObject({
      statusCode: 409,
      code: "CLINICAL_NOTE_REQUIRED",
    });
    expect(tx.update).not.toHaveBeenCalled();
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });
});
