const BLOCKED_PATHS = ["/login", "/signup"];

export function getSafeRedirectUrl(
  raw: string | null | undefined,
  origin: string,
  fallback: string
): string {
  if (!raw) return fallback;

  // backslashes and control characters are never legitimate here
  if (/[\\\u0000-\u001f]/.test(raw)) return fallback;

  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return fallback;
    if (url.pathname.startsWith("/api") || BLOCKED_PATHS.includes(url.pathname)) {
      return fallback;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
