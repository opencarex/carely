import type { ReactNode } from "react";
import { AppShell } from "@/components/workspace/app-shell";
import { NurseWorkspaceProvider } from "@/components/nurse/nurse-workspace-provider";

export default function NurseLayout({ children }: { children: ReactNode }) {
  return (
    <NurseWorkspaceProvider>
      <AppShell
        role="nurse"
        user={{ name: "N. Fernando", detail: "OPD Nurse", initials: "NR" }}
      >
        {children}
      </AppShell>
    </NurseWorkspaceProvider>
  );
}
