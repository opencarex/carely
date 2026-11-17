import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { betterAuth } from "better-auth";
import { hashPassword } from "better-auth/crypto";

const state = vi.hoisted(() => ({
  store: { user: [], session: [], account: [], verification: [] } as Record<
    string,
    Record<string, unknown>[]
  >,
  audits: [] as Record<string, unknown>[],
  failAudit: false,
}));
vi.mock("better-auth/adapters/drizzle", async () => {
  const { memoryAdapter } = await import("better-auth/adapters/memory");
  return { drizzleAdapter: () => memoryAdapter(state.store) };
});
vi.mock("@/lib/db", () => {
  const tx = {
    select: () => ({
      from: () => ({
        where: (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => ({
          for: async () =>
            state.store.session.filter(
              (row) => row.token === new PgDialect().sqlToQuery(condition).params[0]
            ),
        }),
      }),
    }),
    delete: () => ({
      where: async (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => {
        const id = new PgDialect().sqlToQuery(condition).params[0];
        state.store.session = state.store.session.filter((row) => row.id !== id);
      },
    }),
    insert: () => ({
      values: (event: Record<string, unknown>) => ({
        returning: async () => {
          if (state.failAudit) throw new Error("Audit unavailable");
          state.audits.push(event);
          return [{ id: "audit", ...event }];
        },
      }),
    }),
  };
  return {
    db: {
      transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
        const snapshot = structuredClone(state.store);
        const audits = [...state.audits];
        try {
          return await callback(tx);
        } catch (error) {
          for (const key of Object.keys(snapshot)) state.store[key] = snapshot[key];
          state.audits = audits;
          throw error;
        }
      },
    },
  };
});
import { auditedAuthAdapter, authAuditHooks } from "@/lib/services/auth-audit";

let auth: Pick<ReturnType<typeof betterAuth>, "handler">;
const secret = "auth-audit-test-secret-at-least-32-characters";
const password = "Test-password-123!";
beforeEach(async () => {
  for (const key of Object.keys(state.store)) state.store[key] = [];
  state.audits = [];
  state.failAudit = false;
  state.store.user.push({
    id: "patient-1",
    name: "Private Name",
    email: "private@example.test",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  state.store.account.push({
    id: "credential-1",
    userId: "patient-1",
    accountId: "patient-1",
    providerId: "credential",
    password: await hashPassword(password),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret,
    database: auditedAuthAdapter,
    hooks: authAuditHooks,
    emailAndPassword: { enabled: true },
    logger: { disabled: true },
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
  });
});

async function signIn(attempt = password) {
  return auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ email: "private@example.test", password: attempt }),
    })
  );
}
function cookie(response: Response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
}
async function signOut(headers: Record<string, string> = {}) {
  return auth.handler(
    new Request("http://localhost:3000/api/auth/sign-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        ...headers,
      },
      body: "{}",
    })
  );
}

describe("Authentication audit with real Better Auth endpoints", () => {
  it("records a successful sign-in with a session id and no credentials", async () => {
    expect((await signIn()).status).toBe(200);
    expect(state.audits).toEqual([
      expect.objectContaining({
        action: "auth.sign_in",
        userId: "patient-1",
        entityId: state.store.session[0].id,
        metadata: {},
      }),
    ]);
    expect(JSON.stringify(state.audits)).not.toMatch(/private|password|token/i);
  });
  it("records failed credentials anonymously without saving the supplied email", async () => {
    expect((await signIn("wrong-password")).status).toBe(401);
    expect(state.store.session).toHaveLength(0);
    expect(state.audits).toEqual([
      expect.objectContaining({
        action: "auth.sign_in_failed",
        userId: null,
        entityId: "unknown",
        metadata: {},
      }),
    ]);
  });
  it("revokes and audits a signed-in session once even when sign-out is retried", async () => {
    const signedIn = await signIn();
    const headers = { Cookie: cookie(signedIn) };
    expect((await signOut(headers)).status).toBe(200);
    expect((await signOut(headers)).status).toBe(200);
    expect(state.store.session).toHaveLength(0);
    expect(state.audits.map((event) => event.action)).toEqual([
      "auth.sign_in",
      "auth.sign_out",
    ]);
  });
  it("rolls back a new session when its audit cannot be saved", async () => {
    state.failAudit = true;
    expect((await signIn()).status).toBe(500);
    expect(state.store.session).toHaveLength(0);
    expect(state.audits).toHaveLength(0);
  });
});
