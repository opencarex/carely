import { describe, expect, it, vi } from "vitest";
import type { DbExecutor } from "@/lib/db/types";
vi.mock("@/lib/db", () => ({ db: {} }));
import { canViewPatientAdmin } from "@/lib/services/access-policy";

const actor = { userId: "patient-owner", role: "patient" };
function records(ownerId: string): DbExecutor {
  const rows = [[{ role: "patient", banned: false }], [{ userId: ownerId }]];
  return {
    select: () => {
      const query = Object.assign(Promise.resolve(rows.shift() ?? []), {
        from: () => query,
        where: () => query,
        limit: () => query,
      });
      return query;
    },
  } as unknown as DbExecutor;
}
describe("Patient privacy", () => {
  it("lets a patient access their own patient record", async () => {
    expect(await canViewPatientAdmin(actor, "own-record", records(actor.userId))).toBe(
      true
    );
  });
  it("denies a patient access to another patient's record", async () => {
    expect(
      await canViewPatientAdmin(actor, "other-record", records("another-user"))
    ).toBe(false);
  });
});
