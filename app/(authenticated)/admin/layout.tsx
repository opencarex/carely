import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/workspace/app-shell";
import { auth } from "@/lib/auth";

export const instant = false;

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AD"
  );
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <AppShell
      role="admin"
      user={{
        name: session.user.name || "System Admin",
        detail: "Administrator",
        initials: getInitials(session.user.name || "System Admin"),
      }}
    >
      {children}
    </AppShell>
  );
}
