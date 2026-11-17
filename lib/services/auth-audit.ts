import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema/auth";
import type { DbTransaction } from "@/lib/db/types";
import { authActions } from "@/lib/audit/actions/auth";
import { recordAudit } from "./audit";

const config = {
  provider: "pg",
  schema: { user, session, account, verification },
} as const;
type AdapterFactory = ReturnType<typeof drizzleAdapter>;
type AuthAdapter = ReturnType<AdapterFactory>;

// Better Auth 1.7 defers database after-hooks until commit. Wrap the adapter's
// session insert instead, so an audit failure also rolls back the new session.
export const auditedAuthAdapter: AdapterFactory = (options) => {
  function adapterFor(
    executor: typeof db | DbTransaction,
    tx?: DbTransaction
  ): AuthAdapter {
    const adapter = drizzleAdapter(executor, config)(options);
    const create: typeof adapter.create = async <
      T extends Record<string, unknown>,
      R = T,
    >(input: {
      model: string;
      data: Omit<T, "id">;
      select?: string[];
      forceAllowId?: boolean;
    }): Promise<R> => {
      if (input.model !== "session") return adapter.create<T, R>(input);
      const insert = async (transaction: DbTransaction) => {
        const row = await drizzleAdapter(
          transaction,
          config
        )(options).create<T, R>(input);
        const identity = row as { id?: unknown; userId?: unknown };
        if (typeof identity.id !== "string" || typeof identity.userId !== "string") {
          throw new Error("Invalid authentication session.");
        }
        await recordAudit(transaction, {
          actorId: identity.userId,
          action: authActions.signIn,
          targetType: "session",
          targetId: identity.id,
        });
        return row;
      };
      return tx ? insert(tx) : db.transaction(insert);
    };
    return {
      ...adapter,
      create,
      // Preserve the wrapper when Better Auth starts a larger transaction.
      transaction: async (callback) =>
        tx
          ? callback(adapterFor(tx, tx))
          : db.transaction((inner) => callback(adapterFor(inner, inner))),
    };
  }
  return adapterFor(db);
};

export async function auditSignOut(token: string) {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ id: session.id, userId: session.userId })
      .from(session)
      .where(eq(session.token, token))
      .for("update");
    if (!current) return;
    await tx.delete(session).where(eq(session.id, current.id));
    await recordAudit(tx, {
      actorId: current.userId,
      action: authActions.signOut,
      targetType: "session",
      targetId: current.id,
    });
  });
}

const failedSignOuts = new WeakSet<object>();

export const authAuditHooks = {
  before: createAuthMiddleware(async (ctx) => {
    if (ctx.path !== "/sign-out") return;
    // The endpoint invokes this after its validation. Its context is a per-call
    // copy, so concurrent requests keep their own internal adapter unchanged.
    ctx.context.internalAdapter = {
      ...ctx.context.internalAdapter,
      deleteSession: async (token) => {
        try {
          await auditSignOut(token);
        } catch (error) {
          failedSignOuts.add(ctx.context);
          throw error;
        }
      },
    };
  }),
  after: createAuthMiddleware(async (ctx) => {
    // The built-in sign-out endpoint catches deletion errors; report a failure
    // explicitly so a rolled-back session is never presented as revoked.
    if (failedSignOuts.delete(ctx.context)) {
      ctx.context.responseHeaders?.delete("set-cookie");
      throw new APIError("INTERNAL_SERVER_ERROR", {
        message: "Unable to sign out. Please retry.",
      });
    }
    if (ctx.path !== "/sign-in/email") return;
    const result = ctx.context.returned;
    if (!isAPIError(result) || result.statusCode < 400 || result.statusCode >= 500)
      return;
    await db.transaction((tx) =>
      recordAudit(tx, {
        actorId: null,
        action: authActions.signInFailed,
        targetType: "session",
        targetId: "unknown",
      })
    );
  }),
};
