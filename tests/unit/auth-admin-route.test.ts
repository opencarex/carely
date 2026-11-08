import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: {} }));
vi.mock("better-auth/next-js", () => ({ toNextJsHandler: () => mocks }));
import { GET, POST } from "@/app/api/auth/[...all]/route";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.GET.mockResolvedValue(new Response(null, { status: 200 }));
  mocks.POST.mockResolvedValue(new Response(null, { status: 200 }));
});
describe("Auth admin HTTP isolation", () => {
  it("rejects admin methods before calling Better Auth", async () => {
    for (const handler of [GET, POST]) {
      expect(
        (await handler(new Request("http://localhost/api/auth/admin/set-role"))).status
      ).toBe(404);
    }
    expect(mocks.GET).not.toHaveBeenCalled();
    expect(mocks.POST).not.toHaveBeenCalled();
  });
  it("keeps ordinary authentication and invitation routes available", async () => {
    expect((await GET(new Request("http://localhost/api/auth/get-session"))).status).toBe(
      200
    );
    expect(
      (
        await POST(
          new Request("http://localhost/api/auth/reset-password", { method: "POST" })
        )
      ).status
    ).toBe(200);
    expect(mocks.GET).toHaveBeenCalledTimes(1);
    expect(mocks.POST).toHaveBeenCalledTimes(1);
  });
});
