import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
import { requireAuth, requireRole } from "@/lib/auth-guard";
beforeEach(() => vi.resetAllMocks());

describe("Shared auth guard", () => {
  it("rejects an already authenticated banned user through both guards", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "staff", role: "admin", banned: true },
    });
    await expect(requireAuth()).rejects.toMatchObject({ statusCode: 403 });
    await expect(requireRole("admin")).rejects.toMatchObject({ statusCode: 403 });
  });
  it("requires a session and checks the current role on each call", async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(requireAuth()).rejects.toMatchObject({ statusCode: 401 });
    mocks.getSession.mockResolvedValue({
      user: { id: "staff", role: "doctor", banned: false },
    });
    await expect(requireRole("admin")).rejects.toMatchObject({ statusCode: 403 });
    await expect(requireRole("doctor")).resolves.toMatchObject({
      user: { role: "doctor" },
    });
  });
});
