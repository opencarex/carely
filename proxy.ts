import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasActiveSession, isPatientRoute } from "@/lib/proxy";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPatientRoute(pathname) || pathname.startsWith("/admin")) {
    if (!hasActiveSession(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/admin/:path*"],
};
