import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/config/navigation";

export const instant = false;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    // If database or session check fails, allow public pages to render
  }

  if (session?.user) {
    redirect(getDefaultRouteForRole(session.user.role));
  }

  return children;
}
