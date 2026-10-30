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

/**
 * Ensures the incoming request has an authenticated session.
 * Throws an AuthError (401) if unauthenticated.
 */
export async function requireAuth(requestHeaders?: Headers): Promise<AuthSession> {
  const session = await auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  });

  if (!session?.user) {
    throw new AuthError("Unauthorized: Session required", 401);
  }

  return session;
}

/**
 * Ensures the incoming request has an authenticated session with one of the allowed roles.
 * Optionally accepts incoming Request Headers.
 * Throws an AuthError (401 if unauthenticated, 403 if insufficient privileges).
 */
export async function requireRole(
  ...rolesOrHeaders: (string | Headers | undefined)[]
): Promise<AuthSession> {
  let reqHeaders: Headers | undefined;
  const roles: string[] = [];

  for (const item of rolesOrHeaders) {
    if (typeof item === "string") {
      roles.push(item);
    } else if (item && typeof item === "object" && "get" in item) {
      reqHeaders = item as Headers;
    }
  }

  const session = await requireAuth(reqHeaders);
  const userRole = session.user.role;

  if (!userRole || !roles.includes(userRole)) {
    throw new AuthError("Forbidden: Insufficient privileges", 403);
  }

  return session;
}
