import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type AuthUser = AuthSession["user"];

export async function requireAuth(requestHeaders?: Headers): Promise<AuthSession> {
  const session = await auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  });

  if (!session?.user) {
    throw new AuthError("Unauthorized: Session required", 401);
  }

  return session;
}

export async function requireRole(
  roles: string | string[],
  requestHeaders?: Headers
): Promise<AuthSession> {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (allowedRoles.length === 0) {
    throw new Error("requireRole() called with no roles — pass at least one role string.");
  }

  const session = await requireAuth(requestHeaders);
  const userRole = session.user.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new AuthError("Forbidden: Insufficient privileges", 403);
  }

  return session;
}
