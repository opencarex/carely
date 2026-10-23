import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PatientDemoProvider } from "@/components/patient/patient-demo-provider";
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
      .slice(0, 2) || "PT"
  );
}

export default async function PatientLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?callbackUrl=/patient");
  }

  return (
    <PatientDemoProvider>
      <AppShell
        role="patient"
        user={{
          name: session.user.name,
          detail: "Patient",
          initials: getInitials(session.user.name),
        }}
      >
        {children}
      </AppShell>
    </PatientDemoProvider>
  );
}
