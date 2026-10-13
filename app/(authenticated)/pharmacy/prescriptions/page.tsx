import type { Metadata } from "next";
import { PageTitle } from "@/components/workspace/workspace-ui";
import { PrescriptionWorkbench } from "@/components/pharmacy/prescription-workbench";

export const metadata: Metadata = { title: "Prescriptions" };
export const instant = false;

export default function PrescriptionWorkbenchPage() {
  return (
    <>
      <PageTitle
        eyebrow="Pharmacy workspace"
        title="Prescriptions"
        description="Review prescriptions and dispense medicines."
      />
      <PrescriptionWorkbench />
    </>
  );
}
