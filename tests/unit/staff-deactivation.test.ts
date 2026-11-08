import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks }));
vi.mock("@/lib/auth", () => ({ auth: { api: {} } }));
import { toggleStaffStatus } from "@/lib/services/staff";
import { session } from "@/lib/db/schema/auth";
import { auditLog } from "@/lib/db/schema/audit-log";

function prepare(...rows: object[][]) {
  const select = vi.fn(() => {
    const chain = Object.assign(Promise.resolve(rows.shift() ?? []), {
      from: () => chain,
      where: () => chain,
      limit: () => chain,
      for: () => chain,
    });
    return chain;
  });
  const update = vi.fn(() => ({
    set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
  }));
  const remove = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }));
  const values = vi.fn(() => ({
    returning: vi.fn().mockResolvedValue([{ id: "audit" }]),
  }));
  const insert = vi.fn(() => ({ values }));
  const tx = { select, update, delete: remove, insert };
  mocks.transaction.mockImplementation(async (callback) => callback(tx));
  return { update, remove, insert, values };
}
beforeEach(() => vi.resetAllMocks());
const actor = { userId: "admin-actor", role: "admin" };

describe("Staff deactivation foundation", () => {
  it("revokes sessions and writes an audit event in the domain transaction", async () => {
    const { remove, insert, values } = prepare(
      [{ role: "admin", banned: false }],
      [{ id: "staff", role: "nurse", banned: false }]
    );
    await expect(toggleStaffStatus("staff", false, actor)).resolves.toEqual({
      success: true,
      active: false,
    });
    expect(remove).toHaveBeenCalledWith(session);
    expect(insert).toHaveBeenCalledWith(auditLog);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: actor.userId,
        entityId: "staff",
        action: "staff.deactivated",
        metadata: { changedFields: ["active"] },
      })
    );
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
  it.each(["admin", "patient"])("rejects %s targets without mutations", async (role) => {
    const { update, remove } = prepare(
      [{ role: "admin", banned: false }],
      [{ id: "target", role, banned: false }]
    );
    await expect(toggleStaffStatus("target", false, actor)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
  it("rejects a deactivated administrator before mutating a target", async () => {
    const { update } = prepare([{ role: "admin", banned: true }]);
    await expect(toggleStaffStatus("staff", false, actor)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(update).not.toHaveBeenCalled();
  });
  it("audits reactivation when the doctor profile was inactive but the user was not banned", async () => {
    const { remove, values } = prepare(
      [{ role: "admin", banned: false }],
      [{ id: "staff", role: "doctor", banned: false }],
      [{ isActive: false }]
    );
    await toggleStaffStatus("staff", true, actor);
    expect(remove).not.toHaveBeenCalled();
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ action: "staff.reactivated" })
    );
  });
});
