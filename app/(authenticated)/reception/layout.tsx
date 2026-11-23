import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/workspace/app-shell";
import { requireAuth } from "@/lib/auth-guard";
import { getDefaultRouteForRole } from "@/lib/config/navigation";

export const instant = false;

export default async function ReceptionLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAuth();
  if (user.role !== "receptionist") redirect(getDefaultRouteForRole(user.role));
  return (
    <AppShell role="reception" user={{ name: user.name, detail: "Receptionist" }}>
      {children}
    </AppShell>
  );
}
