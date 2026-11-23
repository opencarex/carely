import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/workspace/app-shell";
import { requireAuth } from "@/lib/auth-guard";
import { getDefaultRouteForRole } from "@/lib/config/navigation";

export const instant = false;

export default async function PharmacyLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAuth();
  if (user.role !== "pharmacist") redirect(getDefaultRouteForRole(user.role));
  return (
    <AppShell role="pharmacy" user={{ name: user.name, detail: "Pharmacist" }}>
      {children}
    </AppShell>
  );
}
