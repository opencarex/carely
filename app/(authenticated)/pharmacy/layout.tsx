import type { ReactNode } from "react";
import { PharmacyDemoProvider } from "@/components/pharmacy/pharmacy-demo-provider";
import { AppShell } from "@/components/workspace/app-shell";

export default function PharmacyLayout({ children }: { children: ReactNode }) {
  return (
    <PharmacyDemoProvider>
      <AppShell
        role="pharmacy"
        user={{ name: "A. Silva", detail: "Pharmacist", initials: "PH" }}
      >
        {children}
      </AppShell>
    </PharmacyDemoProvider>
  );
}
