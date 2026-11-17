import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  select: vi.fn(),
  invite: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: mocks }));
vi.mock("@/lib/auth", () => ({ auth: { api: { requestPasswordReset: mocks.invite } } }));
vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed"),
}));
import { createStaffMember } from "@/lib/services/staff";
import { user } from "@/lib/db/schema/auth";
import { auditLog } from "@/lib/db/schema/audit-log";

const actor = { userId: "admin-actor", role: "admin" };
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
  const values = vi.fn(() => ({
    returning: vi.fn().mockResolvedValue([{ id: "audit" }]),
  }));
  const insert = vi.fn(() => ({ values }));
  const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }));
  const update = vi.fn(() => ({ set }));
  const remove = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }));
  const tx = { select, insert, update, delete: remove };
  mocks.transaction.mockImplementation(async (callback) => callback(tx));
  mocks.select.mockImplementation(select);
  return { tx, values, insert, update, set, remove };
}
beforeEach(() => vi.clearAllMocks());

describe("Staff audit events", () => {
  it("creates staff and an audit in one transaction before sending the invitation", async () => {
    const { values, insert } = prepare([], [{ role: "admin", banned: false }]);
    await createStaffMember(
      {
        name: "Private Name",
        email: "private@example.test",
        role: "nurse",
        department: "Nursing",
      },
      actor
    );
    expect(insert).toHaveBeenCalledWith(user);
    expect(insert).toHaveBeenCalledWith(auditLog);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "staff.created",
        userId: actor.userId,
        metadata: { toRole: "nurse" },
      })
    );
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.invite).toHaveBeenCalledTimes(1);
  });
  it("rejects staff creation by a non-admin without writes or an invitation", async () => {
    prepare();
    await expect(
      createStaffMember(
        {
          name: "Private Name",
          email: "private@example.test",
          role: "nurse",
          department: "Nursing",
        },
        { userId: "nurse", role: "nurse" }
      )
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.invite).not.toHaveBeenCalled();
  });
});
