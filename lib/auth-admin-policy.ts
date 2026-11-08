// Better Auth's generic admin API bypasses our staff service invariants.
// Keep its plugin for ban-on-sign-in behavior, but expose no HTTP admin methods.
export const disabledAuthAdminPaths = [
  "/admin/set-role",
  "/admin/get-user",
  "/admin/create-user",
  "/admin/update-user",
  "/admin/list-users",
  "/admin/list-user-sessions",
  "/admin/unban-user",
  "/admin/ban-user",
  "/admin/impersonate-user",
  "/admin/stop-impersonating",
  "/admin/revoke-user-session",
  "/admin/revoke-user-sessions",
  "/admin/remove-user",
  "/admin/set-user-password",
  "/admin/has-permission",
];

export function isBlockedAuthAdminPath(url: string): boolean {
  try {
    const path = decodeURIComponent(new URL(url).pathname)
      .replace(/\/{2,}/g, "/")
      .toLowerCase();
    return path === "/api/auth/admin" || path.startsWith("/api/auth/admin/");
  } catch {
    return true;
  }
}
