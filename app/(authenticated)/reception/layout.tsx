import type { ReactNode } from "react";
import { ReceptionDemoProvider } from "@/components/reception/reception-demo-provider";
import { AppShell } from "@/components/workspace/app-shell";

export default function ReceptionLayout({ children }: { children: ReactNode }) {
  return (
    <ReceptionDemoProvider>
      <AppShell
        role="reception"
        user={{ name: "M. Perera", detail: "Reception", initials: "RC" }}
      >
        {children}
      </AppShell>
    </ReceptionDemoProvider>
  );
}
