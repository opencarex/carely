import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), transition: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { transaction: mocks.transaction } }));
vi.mock("@/lib/services/queue", () => ({ transitionQueueEntry: mocks.transition }));
vi.mock("@/lib/clinic-time", () => ({
  colomboNow: () => ({ date: "2026-11-14", time: "10:00:00" }),
}));

import { appointment } from "@/lib/db/schema/appointment";
import { encounter } from "@/lib/db/schema/encounter";
import { queueEntry } from "@/lib/db/schema/queue-entry";
import { auditLog } from "@/lib/db/schema/audit-log";
import { openConsultation } from "@/lib/services/consultation";

const entryId = "11111111-1111-4111-8111-111111111111";
const actor = { userId: "doctor-user", role: "doctor" };
const booking = { id: "appointment-id", status: "booked", appointmentDate: "2026-11-14" };
const visit = { id: "encounter-id", status: "in_progress", endedAt: null };
const calledAt = new Date("2026-11-14T04:30:00Z");

function prepare(
  options: {
    account?: { role: string; banned: boolean } | null;
    reference?: { appointmentId: string } | null;
    booking?: typeof booking | null;
    owned?: boolean;
    visit?: { id: string; status: string; endedAt: Date | null } | null;
    entry?: { id: string; status: string } | null;
  } = {}
) {
  const account =
    options.account === undefined ? { role: "doctor", banned: false } : options.account;
  const reference =
    options.reference === undefined ? { appointmentId: booking.id } : options.reference;
  const bookingRow = options.booking === undefined ? booking : options.booking;
  const visitRow = options.visit === undefined ? visit : options.visit;
  const entry =
    options.entry === undefined ? { id: entryId, status: "intake_done" } : options.entry;
  const rows = [
    account ? [account] : [],
    reference ? [reference] : [],
    bookingRow ? [bookingRow] : [],
    options.owned === false ? [] : [{ id: booking.id }],
    account ? [account] : [],
    visitRow ? [visitRow] : [],
    entry ? [entry] : [],
  ];
  const locks: unknown[] = [];
  const select = vi.fn(() => {
    let source: unknown;
    const chain = Object.assign(Promise.resolve(rows.shift() ?? []), {
      from: (table: unknown) => {
        source = table;
        return chain;
      },
      innerJoin: () => chain,
      where: () => chain,
      limit: () => chain,
      for: () => {
        locks.push(source);
        return chain;
      },
    });
    return chain;
  });
  const values = vi.fn(() => ({
    returning: vi.fn().mockResolvedValue([{ id: "audit-id" }]),
  }));
  const tx = { select, insert: vi.fn(() => ({ values })) };
  mocks.transaction.mockImplementation(async (run) => run(tx));
  mocks.transition.mockResolvedValue({ id: entryId, status: "with_doctor", calledAt });
  return { tx, locks, values };
}

beforeEach(() => vi.resetAllMocks());

describe("Open consultation", () => {
  it("checks ownership, locks in shared order and records the transition and audit together", async () => {
    const { tx, locks, values } = prepare();
    expect(await openConsultation({ entryId, actor })).toEqual({
      encounterId: visit.id,
      queueEntryId: entryId,
      status: "with_doctor",
      calledAt: calledAt.toISOString(),
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(locks).toEqual([appointment, encounter, queueEntry]);
    expect(mocks.transition).toHaveBeenCalledWith(
      { entryId, from: "intake_done", to: "with_doctor", actor },
      tx
    );
    expect(tx.insert).toHaveBeenCalledExactlyOnceWith(auditLog);
    expect(values).toHaveBeenCalledWith({
      userId: actor.userId,
      action: "consultation.opened",
      entityType: "encounter",
      entityId: visit.id,
      metadata: { fromStatus: "intake_done", toStatus: "with_doctor" },
    });
  });
  it("does not open a consultation before intake is finished", async () => {
    const { tx } = prepare({ entry: { id: entryId, status: "waiting" } });
    await expect(openConsultation({ entryId, actor })).rejects.toMatchObject({
      statusCode: 409,
      code: "INVALID_WORKFLOW_STATE",
    });
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(tx.insert).not.toHaveBeenCalled();
  });
});
